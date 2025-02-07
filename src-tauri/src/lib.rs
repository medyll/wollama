mod db;
use db::{load_schema, Database};
use rocksdb::{Options, DB};
use serde_json::Value;
use std::env;
use std::sync::{Arc, Mutex};

#[tauri::command]
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
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let current_dir = env::current_dir().expect("Failed to get current directory");
    // Charger le schéma JSON
    let schema = load_schema().expect("Failed to load schema");

    // Utiliser un chemin de base de données unique pour le développement
    let path = format!("{}/database_{}", current_dir.display(), std::process::id());

    // Initialiser la base de données RocksDB
    let db = {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        opts.set_keep_log_file_num(1); // Garder un seul fichier de log
        opts.set_max_open_files(10); // Limiter le nombre de fichiers ouverts
        DB::open(&opts, &path).expect("Failed to open database")
    };

    // Créer une instance de Database
    let database = Database::new(db, schema);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(Mutex::new(database)))
        .invoke_handler(tauri::generate_handler![get_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
