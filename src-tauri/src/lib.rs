mod db;
use db::{load_schema, Database};
use rocksdb::{Options, DB};
use serde_json::Value;
use std::env;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
#[tauri::command]
fn modify_collection(
    db: tauri::State<'_, Arc<Mutex<Database>>>,
    table_name: &str,
    action: &str,
    data: Value,
) -> Result<(), String> {
    let mut db = db.lock().map_err(|e| e.to_string())?;
    db.validate_and_modify_data(table_name, action, data)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let current_dir = env::current_dir().expect("Failed to get current directory");
    println!("Current directory: {:?}", current_dir);
    // Charger le schéma JSON
    let schema = load_schema("src-tauri/schemas/db_schema.json").expect("Failed to load schema");

    // Initialiser la base de données RocksDB
    let path = "database";
    let db = {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        DB::open(&opts, path).expect("Failed to open database")
    };

    // Créer une instance de Database
    let database = Database::new(db, schema);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(Mutex::new(database)))
        .invoke_handler(tauri::generate_handler![modify_collection])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
