use ollama_rs::generation::embeddings::EmbeddingRequest;
use ollama_rs::generation::embeddings::GenerateEmbeddingsResponse;
use ollama_rs::Ollama;
use qdrant_client::prelude::*;
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::{Distance, VectorsConfig};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug)]
pub enum DocumentSource {
    Directory(PathBuf, bool), // (path, is_recursive)
    Files(Vec<PathBuf>),
}

struct VectorStore {
    client: QdrantClient,
    collection_name: String,
}

impl VectorStore {
    async fn new(
        collection_name: &str,
        vector_size: usize,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let config = QdrantClientConfig::from_url("http://localhost:6334");
        let client = QdrantClient::new(Some(config))?;

        client
            .create_collection(&CreateCollection {
                collection_name: collection_name.to_string(),
                vectors_config: Some(VectorsConfig {
                    config: Some(Config::Params(VectorParams {
                        size: vector_size as u64,
                        distance: Distance::Cosine.into(),
                        ..Default::default()
                    })),
                }),
                ..Default::default()
            })
            .await?;

        Ok(Self {
            client,
            collection_name: collection_name.to_string(),
        })
    }

    async fn add_embedding(
        &self,
        file_path: &PathBuf,
        embedding: Vec<f32>,
        metadata: serde_json::Value,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.client
            .upsert_points(
                &self.collection_name,
                vec![PointStruct::new(
                    file_path.to_string_lossy().into_owned(),
                    embedding,
                    metadata.into(),
                )],
                None,
            )
            .await?;
        Ok(())
    }

    async fn get_all_embeddings(
        &self,
    ) -> Result<Vec<(String, Vec<f32>, Payload)>, Box<dyn std::error::Error>> {
        let response = self
            .client
            .scroll(&self.collection_name, None, None, None, None)
            .await?;
        Ok(response
            .result
            .into_iter()
            .map(|point| (point.id, point.vector, point.payload))
            .collect())
    }
}

async fn generate_embedding(
    content: &str,
    model: &str,
) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
    let ollama = Ollama::default();
    let request = GenerateEmbeddingsRequest::new(model.to_string(), content.to_string());
    let response = ollama.generate_embeddings(request).await?;
    Ok(response.embedding)
}

fn create_sources(
    input: &str,
    recursive: bool,
) -> Result<DocumentSource, Box<dyn std::error::Error>> {
    let path = PathBuf::from(input);

    if path.is_dir() {
        Ok(DocumentSource::Directory(path, recursive))
    } else if path.is_file() {
        Ok(DocumentSource::Files(vec![path]))
    } else {
        // Assume it's a glob pattern
        let files: Vec<PathBuf> = glob::glob(input)?.filter_map(Result::ok).collect();

        if files.is_empty() {
            Err("No files found matching the pattern".into())
        } else {
            Ok(DocumentSource::Files(files))
        }
    }
}

async fn process_documents(
    source: DocumentSource,
    model: &str,
    vector_store: &VectorStore,
) -> Result<(), Box<dyn std::error::Error>> {
    let files = match source {
        DocumentSource::Directory(path, is_recursive) => {
            if is_recursive {
                WalkDir::new(path)
                    .into_iter()
                    .filter_map(|e| e.ok())
                    .filter(|e| e.file_type().is_file())
                    .map(|e| e.path().to_path_buf())
                    .collect()
            } else {
                fs::read_dir(path)?
                    .filter_map(|entry| entry.ok())
                    .filter(|entry| entry.file_type().map(|ft| ft.is_file()).unwrap_or(false))
                    .map(|entry| entry.path())
                    .collect()
            }
        }
        DocumentSource::Files(files) => files,
    };

    for file_path in files {
        let content = fs::read_to_string(&file_path)?;
        let embedding = generate_embedding(&content, model).await?;

        let metadata = fs::metadata(&file_path)?;
        let metadata_json = serde_json::json!({
            "file_path": file_path.to_string_lossy().into_owned(),
            "file_name": file_path.file_name().unwrap().to_string_lossy().into_owned(),
            "creation_date": metadata.created()?.duration_since(SystemTime::UNIX_EPOCH)?.as_secs(),
            "modification_date": metadata.modified()?.duration_since(SystemTime::UNIX_EPOCH)?.as_secs(),
            "file_size": metadata.len(),
        });

        vector_store
            .add_embedding(&file_path, embedding, metadata_json)
            .await?;
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Création du vector store
    let vector_store = VectorStore::new("my_embeddings", 384).await?;
    // Création des sources de documents
    let source = create_sources("/path/to/documents", true)?;
    // Traitement des documents
    process_documents(source, "llama2:latest", &vector_store).await?;

    println!("Processing complete");
    Ok(())
}
