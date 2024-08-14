//use ollama_rs::generation::embeddings::EmbeddingRequest; : do not exists
use ollama_rs::generation::completion::request::GenerationRequest;
use ollama_rs::generation::options::GenerationOptions;
use ollama_rs::Ollama;
use qdrant_client::config::QdrantConfig;
use qdrant_client::prelude::*;
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::VectorParams;
use qdrant_client::qdrant::{CreateCollectionBuilder, VectorParamsBuilder};
use qdrant_client::qdrant::{Distance, VectorsConfig};
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Qdrant;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use walkdir::WalkDir;
#[derive(Debug)]
pub enum DocumentSource {
    Directory(PathBuf, bool), // (path, is_recursive)
    Files(Vec<PathBuf>),
}

struct VectorStore {
    client: Qdrant,
    collection_name: String,
}

impl VectorStore {
    async fn new(
        collection_name: &str,
        vector_size: usize,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let config = QdrantConfig::from_url("http://localhost:6334");
        let client = Qdrant::new(Some(config))?;
        /* the trait bound `qdrant_client::qdrant::CreateCollection: std::convert::From<&qdrant_client::qdrant::CreateCollection>` is not satisfied
        the trait `std::convert::From<CreateCollectionBuilder>` is implemented for `qdrant_client::qdrant::CreateCollection`
        for that trait implementation, expected `CreateCollectionBuilder`, found `&qdrant_client::qdrant::CreateCollection`
        required for `&qdrant_client::qdrant::CreateCollection` to implement `Into<qdrant_client::qdrant::CreateCollection>`rustcClick for full compiler diagnostic
        collection.rs(71, 23): required by a bound in `qdrant_client::qdrant_client::collection::<impl qdrant_client::Qdrant>::create_collection`
        the trait bound `&qdrant_client::qdrant::CreateCollection: Into<qdrant_client::qdrant::CreateCollection>` is not satisfied
        required for `&qdrant_client::qdrant::CreateCollection` to implement `Into<qdrant_client::qdrant::CreateCollection>`rustcClick for full compiler diagnostic
        files.rs(37, 14): required by a bound introduced by this call
        collection.rs(71, 23): required by a bound in `qdrant_client::qdrant_client::collection::<impl qdrant_client::Qdrant>::create_collection`
        files.rs(37, 32): consider dereferencing here: `*` */
        client
            .create_collection(
                CreateCollectionBuilder::new(collection_name).vectors_config(
                    VectorParamsBuilder::new(vector_size as u64, Distance::Cosine),
                ),
            )
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
        /*         the trait bound `UpsertPoints: std::convert::From<&std::string::String>` is not satisfied
        the trait `std::convert::From<UpsertPointsBuilder>` is implemented for `UpsertPoints`
        for that trait implementation, expected `UpsertPointsBuilder`, found `&std::string::String`
        required for `&std::string::String` to implement `Into<UpsertPoints>`rustcClick for full compiler diagnostic
        points.rs(103, 23): required by a bound in `qdrant_client::qdrant_client::points::<impl qdrant_client::Qdrant>::upsert_points`
        // size = 24 (0x18), align = 0x8
        embedding: Vec<f32> */
        self.client
            .upsert_points(UpsertPointsBuilder::new(
                &self.collection_name,
                vec![PointStruct::new(
                    file_path.to_string_lossy().into_owned(),
                    embedding,
                    metadata.into(),
                )],
            ))
            .await?;
        Ok(())
    }

    async fn get_all_embeddings(
        &self,
    ) -> Result<Vec<(String, Vec<f32>, Payload)>, Box<dyn std::error::Error>> {
        /*  a value of type `Vec<(std::string::String, Vec<f32>, qdrant_client::Payload)>` cannot be built from an iterator over elements of type `(Option<PointId>, Option<Vectors>, HashMap<String, Value>)`
        the full name for the type has been written to 'D:\boulot\python\wollama\src-tauri\target\x86_64-pc-windows-msvc\debug\deps\wollama-bd9240c3d28c29eb.long-type-8958202426452054220.txt'
        consider using `--verbose` to print the full type name to the console
        the trait `FromIterator<(std::option::Option<qdrant_client::qdrant::PointId>, std::option::Option<qdrant_client::qdrant::Vectors>, HashMap<std::string::String, qdrant_client::qdrant::Value>)>` is not implemented for `Vec<(std::string::String, Vec<f32>, qdrant_client::Payload)>`
        the trait `FromIterator<(std::string::String, Vec<f32>, qdrant_client::Payload)>` is implemented for `Vec<(std::string::String, Vec<f32>, qdrant_client::Payload)>`
        for that trait implementation, expected `std::string::String`, found `std::option::Option<qdrant_client::qdrant::PointId>`rustcClick for full compiler diagnostic
        files.rs(95, 14): the method call chain might not have had the expected associated types
        iterator.rs(1999, 19): required by a bound in `collect`
        a value of type `Vec<(std::string::String, Vec<f32>, qdrant_client::Payload)>` cannot be built from an iterator over elements of type `(Option<PointId>, Option<Vectors>, HashMap<String, Value>)`
        the full name for the type has been written to 'D:\boulot\python\wollama\src-tauri\target\x86_64-pc-windows-msvc\debug\deps\wollama-a7ab60111d76d570.long-type-12098758380376815729.txt'
        consider using `--verbose` to print the full type name to the console */
        let response = self
            .client
            .scroll(&self.collection_name, None, None, None, None)
            .await?;
        /* unexpected argument of type `std::option::Option<_>`rustcE0061
        files.rs(110, 14): original diagnostic
        the trait bound `ScrollPoints: std::convert::From<&std::string::String>` is not satisfied
        the trait `std::convert::From<ScrollPointsBuilder>` is implemented for `ScrollPoints`
        for that trait implementation, expected `ScrollPointsBuilder`, found `&std::string::String`
        required for `&std::string::String` to implement `Into<ScrollPoints>`rustcClick for full compiler diagnostic
        points.rs(222, 46): required by a bound in `qdrant_client::qdrant_client::points::<impl qdrant_client::Qdrant>::scroll`
        expected 1 argument, found 5 */
        Ok(response
            .result
            .into_iter()
            .map(|point| (point.id, point.vectors, point.payload))
            .collect())
    }
}

async fn generate_embedding(
    content: &str,
    model: &str,
) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
    let ollama = Ollama::default();
    let request = GenerationRequest::new(model.to_string(), content.to_string());
    let response = ollama.generate(request).await?;
    Ok(response.response)
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
