mod db;
use anyhow::Ok;
use db::{initialize_db, Database};
use lazy_static::lazy_static;
use rocksdb::{Options, DB};
use serde_json::Value;
use std::sync::{Arc, Mutex};
use tauri::State;

lazy_static! {
    static ref DATABASE: Database =
        initialize_db("wollama").expect("Failed to initialize database");
}

#[tauri::command]
fn get_data(
    db_state: State<'_, Arc<Mutex<Database>>>,
    table_name: &str,
    action: &str,
    data: Value,
) -> Result<(), String> {
    let mut database = db_state.lock().map_err(|e| e.to_string())?;
    database
        .get_data(table_name, action, data)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let database = initialize_db("wollama").expect("Failed to initialize database");
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DATABASE.clone())
        .invoke_handler(tauri::generate_handler![get_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
