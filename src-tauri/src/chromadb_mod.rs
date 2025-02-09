// src-tauri/src/chromadb.rs
use chromadb::client::{ChromaAuthMethod, ChromaClient, ChromaClientOptions};
use chromadb::collection::CollectionEntries;
use chromadb::collection::ChromaCollection;
use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;

#[derive(Serialize, Deserialize, Debug)]
pub struct FileMetadata {
    pub path: String,
    pub size: u64,
    pub modified: String,
}

pub async fn init_chromadb() -> ChromaCollection {
    let client_options = ChromaClientOptions {
        url: Some("http://localhost:8000".to_string()),
        auth: ChromaAuthMethod::None,
        database: "files".to_string(),
    };
    let client = ChromaClient::new(client_options).await.unwrap();
    let collection = client.create_collection("files", None, true).await.unwrap();
    collection
}

pub fn index_file(collection: &ChromaCollection, file: &FileMetadata) {
    let ids = vec!["red"];
    let text = fs::read_to_string(&file.path).expect("Failed to read file");
    let embedding = generate_embeddings(&text);

    collection.add(
        CollectionEntries {
            ids: ids,
            documents: Some(vec![&text]),
            embeddings: Some(embedding),
            metadatas: Some(vec![serde_json::to_value(file)
                .unwrap()
                .as_object()
                .unwrap()
                .clone()]),
        },
        None,
    );
}

pub fn generate_embeddings(text: &str) -> Vec<Vec<f32>> {
    let output = Command::new("python")
        .arg("../python/generate_embeddings.py")
        .arg(text)
        .output()
        .expect("Failed to execute command");

    let embeddings: Vec<Vec<f32>> =
        serde_json::from_slice(&output.stdout).expect("Failed to parse embeddings");
    embeddings
}
