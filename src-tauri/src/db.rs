use rocketdb::{RocketDb, Transaction};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;

#[derive(Debug, Deserialize)]
struct Schema {
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

// Structure pour gérer la base de données
struct Database {
    db: RocketDb,
    schema: Schema,
    counter: Counter,
}

impl Database {
    fn new(db: RocketDb, schema: Schema) -> Self {
        let mut counter = Counter::new();
        for table_name in schema.tables.keys() {
            counter.counters.insert(table_name.clone(), 0);
        }

        Database {
            db,
            schema,
            counter,
        }
    }

    fn validate_and_modify_data(
        &mut self,
        table_name: &str,
        action: &str,
        data: Value,
    ) -> Result<(), String> {
        let table_schema = self
            .schema
            .tables
            .get(table_name)
            .ok_or("Table not found")?;
        let collection = self.db.get_collection::<Value>(table_name)?;

        // Validate data based on schema
        for (field_name, field_schema) in &table_schema.template.fields {
            let field_value = data
                .get(field_name)
                .ok_or(format!("Field {} is missing", field_name))?;
            self.validate_field(field_value, field_schema)?;
        }

        // Modify collection based on action
        match action {
            "add" => {
                let id = self.counter.get_next_id(table_name);
                collection.insert(id, data);
                Ok(())
            }
            "remove" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                collection.remove(&id);
                Ok(())
            }
            "update" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                collection.insert(id, data);
                Ok(())
            }
            _ => Err(format!("Action {} not supported", action)),
        }
    }

    fn validate_field(&self, value: &Value, field_schema: &FieldSchema) -> Result<(), String> {
        match field_schema.field_type.as_str() {
            "id" => value.as_u64().ok_or("Invalid ID")?,
            "text" => value.as_str().ok_or("Invalid text")?,
            "text-long" => value.as_str().ok_or("Invalid text-long")?,
            "date" => value.as_str().ok_or("Invalid date")?, // You might want to parse the date
            "boolean" => value.as_bool().ok_or("Invalid boolean")?,
            "array-of-number" => value.as_array().ok_or("Invalid array-of-number")?,
            "email" => value.as_str().ok_or("Invalid email")?,
            "password" => value.as_str().ok_or("Invalid password")?,
            _ => return Err("Unknown field type".to_string()),
        };
        Ok(())
    }
}

fn load_schema(file_path: &str) -> Result<Schema, Box<dyn std::error::Error>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);
    let schema: Schema = serde_json::from_reader(reader)?;
    Ok(schema)
}

fn main() {
    let schema = load_schema("src-tauri/schemas/db_schema.json").expect("Failed to load schema");

    let db = RocketDb::new("path/to/database").expect("Failed to open database");
    let mut database = Database::new(db, schema);

    let data = serde_json::json!({
        "id": 1,
        "name": "Agent 1",
        "code": "A1",
        "model": "Model 1",
        "prompt": "Prompt 1",
        "created_at": "2023-01-01T00:00:00Z",
        "ia_lock": true,
        "agentPromptId": 1
    });

    database
        .validate_and_modify_data("agent", "add", data)
        .expect("Failed to modify data");
}
