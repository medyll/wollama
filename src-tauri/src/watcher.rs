// src-tauri/src/watcher.rs

use crate::chromadb_mod::{index_file, FileMetadata};
use chromadb::collection::ChromaCollection;
use notify::{recommended_watcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};

pub struct FolderWatcher {
    watchers: Arc<Mutex<HashMap<String, notify::RecommendedWatcher>>>,
    collection: ChromaCollection,
}

impl FolderWatcher {
    pub fn new(collection: ChromaCollection) -> Self {
        Self {
            watchers: Arc::new(Mutex::new(HashMap::new())),
            collection,
        }
    }

    pub fn add_folder(&self, path: String) {
        let watchers = self.watchers.clone();
        let collection = &self.collection;

        let (tx, rx) = channel();
        let mut watcher = recommended_watcher(tx).unwrap();
        watcher
            .watch(std::path::Path::new(&path), RecursiveMode::Recursive)
            .unwrap();

        let mut watchers = watchers.lock().unwrap();
        watchers.insert(path.clone(), watcher);

        println!("Started watching folder: {}", path);

        loop {
            match rx.recv() {
                Ok(event) => {
                    println!("Change detected in {}: {:?}", path, event);
                    let files = self.scan_folder(&path);
                    for file in files {
                        index_file(&collection, &file);
                    }
                }
                Err(e) => println!("Watch error in {}: {:?}", path, e),
            }
        }
        /* std::thread::spawn(move || loop {
            match rx.recv() {
                Ok(event) => {
                    println!("Change detected in {}: {:?}", path, event);
                    let files = scan_folder(&path);
                    for file in files {
                        index_file(&collection, &file);
                    }
                }
                Err(e) => println!("Watch error in {}: {:?}", path, e),
            }
        }); */
    }
    pub fn scan_folder(&self, path: &str) -> Vec<FileMetadata> {
        let mut files = Vec::new();

        // Vérifie si le chemin existe et est un dossier
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();

                    // Vérifie si c'est un fichier (et non un dossier)
                    if path.is_file() {
                        if let Ok(metadata) = fs::metadata(&path) {
                            // Récupère la date de modification
                            let modified = metadata
                                .modified()
                                .unwrap_or_else(|_| std::time::SystemTime::UNIX_EPOCH);
                            let modified = format!("{:?}", modified);

                            // Ajoute les métadonnées du fichier à la liste
                            files.push(FileMetadata {
                                path: path.to_str().unwrap().to_string(),
                                size: metadata.len(),
                                modified,
                            });
                        }
                    }
                }
            }
        }

        files
    }
    pub fn remove_folder(&self, path: String) {
        let mut watchers = self.watchers.lock().unwrap();
        if let Some(watcher) = watchers.remove(&path) {
            println!("Stopped watching folder: {}", path);
        }
    }
}
