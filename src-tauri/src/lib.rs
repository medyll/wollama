mod db;
use db::{initialize_db, Database};
use lazy_static::lazy_static;
use rocksdb::{Options, DB};
use serde_json::Value;
use std::sync::{Arc, Mutex};
use tauri::State;
use watcher::FolderWatcher;
mod chromadb_mod;
mod watcher;
use chromadb_mod::{index_file, init_chromadb};

struct AppState {
    folder_watcher: FolderWatcher,
    database: Database,
}

#[tauri::command]
fn get_data(path: String, state: State<AppState>) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let database = initialize_db("wollama").expect("Failed to initialize database");

    let collection = init_chromadb().await;
    let path = "./path/to/watch";
    let folder_watcher = FolderWatcher::new(collection);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            folder_watcher,
            database,
        })
        .invoke_handler(tauri::generate_handler![get_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

//.manage(DATABASE.clone())
// .invoke_handler(tauri::generate_handler![get_data])

/* #[tauri::command]
fn get_data(
    db: tauri::State<'_, Arc<Mutex<Database>>>,
    table_name: &str,
    action: &str,
    data: Value,
) -> Result<(), String> {
    let mut db = db.lock().map_err(|e| e.to_string())?;
    db.get_data(table_name, action, data)
        .map_err(|e| e.to_string())?;
    Ok(())
} */

/* #[tauri::command]
fn add_watch_folder(path: String, state: State<AppState>) {
    state.folder_watcher.add_folder(path);
}

#[tauri::command]
fn remove_watch_folder(path: String, state: State<AppState>) {
    state.folder_watcher.remove_folder(path);
} */
