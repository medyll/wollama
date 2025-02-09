use rocksdb::{Options, DB};
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, Mutex};

mod idb;
use idb::IdB;
mod types;
use types::OperatorType;

#[derive(Debug, Deserialize)]
pub struct Schema {
    tables: HashMap<String, TableSchema>,
}

#[derive(Debug, Deserialize)]
struct TableSchema {
    keyPath: Vec<String>,
    template: Template,
}

#[derive(Debug, Deserialize)]
struct Template {
    index: String,
    presentation: Vec<String>,
    fields: HashMap<String, FieldSchema>,
    fks: HashMap<String, ForeignKeySchema>,
}

#[derive(Debug, Deserialize)]
struct FieldSchema {
    #[serde(rename = "type")]
    field_type: String,
    readonly: Option<bool>,
    private: Option<bool>,
    required: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct ForeignKeySchema {
    code: String,
    rules: Vec<String>,
    multiple: bool,
}

#[derive(Debug, Clone)]
struct Field {
    name: String,
    field_type: FieldType,
    is_private: bool,
    is_readonly: bool,
    is_required: bool,
}

#[derive(Debug, Clone)]
enum FieldType {
    Id,
    Text,
    TextLong,
    Date,
    Boolean,
    ArrayOfNumber,
    Email,
    Password,
    ForeignKey(String),
}

#[derive(Debug, Clone)]
struct ForeignKey {
    code: String,
    rules: Vec<String>,
    multiple: bool,
}

#[derive(Debug, Clone)]
struct Table {
    name: String,
    key_path: Vec<String>,
    fields: Vec<Field>,
    foreign_keys: HashMap<String, ForeignKey>,
    presentation: Vec<String>,
}

#[derive(Debug, Clone)]
struct Counter {
    counters: HashMap<String, u64>,
}

impl Counter {
    fn new() -> Self {
        Counter {
            counters: HashMap::new(),
        }
    }

    fn get_next_id(&mut self, table_name: &str) -> u64 {
        let counter = self.counters.entry(table_name.to_string()).or_insert(0);
        *counter += 1;
        *counter
    }
}

pub struct Database {
    db: Arc<Mutex<DB>>,
    schema: Schema,
    counter: Counter,
}

impl Database {
    pub fn new(db: DB, schema: Schema) -> Self {
        let mut counter = Counter::new();
        for table_name in schema.tables.keys() {
            counter.counters.insert(table_name.clone(), 0);
        }

        Database {
            db: Arc::new(Mutex::new(db)),
            schema,
            counter,
        }
    }

    pub fn get_data(&mut self, table_name: &str, action: &str, data: Value) -> Result<(), String> {
        let table_schema = self
            .schema
            .tables
            .get(table_name)
            .ok_or("Table not found")?;

        // Validate data based on schema
        for (field_name, field_schema) in &table_schema.template.fields {
            let field_value = data
                .get(field_name)
                .ok_or(format!("Field {} is missing", field_name))?;
            self.validate_field(field_value, field_schema)?;
        }

        // Define the command strategy
        let idbql_state = IdB::new(self.db.clone());

        // Execute the command based on action
        match action {
            "get_one" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                let result = idbql_state.get_one(id)?;
                println!("Get result: {:?}", result);
                Ok(())
            }
            "getAll" => {
                let result = idbql_state.get_all()?;
                println!("GetAll result: {:?}", result);
                Ok(())
            }
            "create" => {
                idbql_state.add(data)?;
                Ok(())
            }
            "delete" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                idbql_state.delete(id)?;
                Ok(())
            }
            "update" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                idbql_state.update(id, data)?;
                Ok(())
            }
            "where" => {
                let query = data["query"].as_object().ok_or("Invalid query")?;
                let query: HashMap<String, OperatorType> = query
                    .iter()
                    .map(|(k, v)| (k.clone(), serde_json::from_value(v.clone()).unwrap()))
                    .collect();
                let result = idbql_state.where_query(&query)?;
                println!("Where result: {:?}", result);
                Ok(())
            }
            "updateWhere" => {
                let query = data["query"].as_object().ok_or("Invalid query")?;
                let query: HashMap<String, OperatorType> = query
                    .iter()
                    .map(|(k, v)| (k.clone(), serde_json::from_value(v.clone()).unwrap()))
                    .collect();
                idbql_state.update_where(&query, data)?;
                Ok(())
            }
            "deleteWhere" => {
                let query = data["query"].as_object().ok_or("Invalid query")?;
                let query: HashMap<String, OperatorType> = query
                    .iter()
                    .map(|(k, v)| (k.clone(), serde_json::from_value(v.clone()).unwrap()))
                    .collect();
                idbql_state.delete_where(&query)?;
                Ok(())
            }
            _ => Err(format!("Action {} not supported", action)),
        }
    }

    fn validate_field(&self, value: &Value, field_schema: &FieldSchema) -> Result<(), String> {
        match field_schema.field_type.as_str() {
            "id" => value.as_u64().ok_or("Invalid ID").map(|_| ())?,
            "text" => value.as_str().ok_or("Invalid text").map(|_| ())?,
            "text-long" => value.as_str().ok_or("Invalid text-long").map(|_| ())?,
            "date" => value.as_str().ok_or("Invalid date").map(|_| ())?,
            "boolean" => value.as_bool().ok_or("Invalid boolean").map(|_| ())?,
            "array-of-number" => value
                .as_array()
                .ok_or("Invalid array-of-number")
                .map(|_| ())?,
            "email" => value.as_str().ok_or("Invalid email").map(|_| ())?,
            "password" => value.as_str().ok_or("Invalid password").map(|_| ())?,
            _ => return Err("Unknown field type".to_string()),
        };
        Ok(())
    }
}

pub fn load_schema() -> Result<Schema, Box<dyn std::error::Error>> {
    let schema_str = include_str!("../resources/schemas/db_schema.json");
    let schema: Schema = serde_json::from_str(schema_str)?;
    Ok(schema)
}

pub fn initialize_db(db_path: &str) -> Result<Database, String> {
    let current_dir = env::current_dir().expect("Failed to get current directory");
    let database_path = format!("{}/database/{}", current_dir.display(), db_path);
    // let database_path = format!("{}/database/{}", current_dir.display(), db_path);
    let db = {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        opts.set_keep_log_file_num(1);
        opts.set_max_open_files(10);
        DB::open(&opts, &database_path).expect("Failed to open database")
    };
    let schema = load_schema().expect("Failed to load schema");
    let database: Database = Database::new(db, schema);

    Ok(database)
}
