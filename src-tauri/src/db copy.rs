use chrono::{DateTime, Utc};
use serde_json::Value;
use std::{any::Any, collections::HashMap};

#[derive(Debug, Clone)]
enum FieldType {
    Id,
    Text,
    TextLong,
    Date,
    Boolean,
    ArrayOfNumber(Vec<f64>),
    Email,
    Password,
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
    presentation: String,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Agent {
    id: u64,
    prompt_id: u64,
    created_at: DateTime<Utc>,
    name: String,
    code: String,
    model: String,
    prompt: String,
    ia_lock: bool,
    agent_prompt_id: u64,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct AgentPrompt {
    id: u64,
    created_at: DateTime<Utc>,
    value: String,
    name: String,
    code: String,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct AgentOf {
    id: u64,
    created_at: DateTime<Utc>,
    code: String,
    name: String,
    context: Vec<f64>,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Chat {
    id: u64,
    chat_id: String,
    created_at: DateTime<Utc>,
    category: String,
    category_id: u64,
    date_last_message: DateTime<Utc>,
    name: String,
    description: String,
    ia_lock: bool,
    space_id: u64,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Category {
    id: u64,
    code: String,
    name: String,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Space {
    id: u64,
    code: String,
    name: String,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Tags {
    id: u64,
    code: String,
    name: String,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Message {
    id: u64,
    message_id: String,
    chat_id: String,
    created_at: DateTime<Utc>,
    content: String,
    status: String,
    context: Vec<f64>,
    resume: String,
    model: String,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Prompt {
    id: u64,
    name: String,
    code: String,
    value: String,
    created_at: DateTime<Utc>,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct Settings {
    id: u64,
    user_id: u64,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    code: String,
    value: String,
    ia_lock: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
struct User {
    id: u64,
    name: String,
    color: String,
    created_at: DateTime<Utc>,
    email: String,
    password: String,
    ia_lock: bool,
}

#[derive(Debug, Clone)]
struct Counter {
    agent_counter: u64,
    agent_prompt_counter: u64,
    agent_of_counter: u64,
    chat_counter: u64,
    category_counter: u64,
    space_counter: u64,
    tag_counter: u64,
    message_counter: u64,
    prompt_counter: u64,
    setting_counter: u64,
    user_counter: u64,
}

pub(crate) struct Database {
    agent: HashMap<u64, Agent>,
    agent_prompt: HashMap<u64, AgentPrompt>,
    agent_ofs: HashMap<u64, AgentOf>,
    chats: HashMap<u64, Chat>,
    categories: HashMap<u64, Category>,
    spaces: HashMap<u64, Space>,
    tags: HashMap<u64, Tags>,
    messages: HashMap<u64, Message>,
    prompts: HashMap<u64, Prompt>,
    settings: HashMap<u64, Settings>,
    users: HashMap<u64, User>,
    counter: Counter,
}

enum Collection<'a> {
    Agents(&'a mut HashMap<u64, Agent>),
    AgentPrompts(&'a mut HashMap<u64, AgentPrompt>),
    AgentOfs(&'a mut HashMap<u64, AgentOf>),
    Chats(&'a mut HashMap<u64, Chat>),
    Categories(&'a mut HashMap<u64, Category>),
    Spaces(&'a mut HashMap<u64, Space>),
    Tags(&'a mut HashMap<u64, Tags>),
    Messages(&'a mut HashMap<u64, Message>),
    Prompts(&'a mut HashMap<u64, Prompt>),
    Settings(&'a mut HashMap<u64, Settings>),
    Users(&'a mut HashMap<u64, User>),
}

impl Database {
    fn new() -> Self {
        Database {
            agent: HashMap::new(),
            agent_prompt: HashMap::new(),
            agent_ofs: HashMap::new(),
            chats: HashMap::new(),
            categories: HashMap::new(),
            spaces: HashMap::new(),
            tags: HashMap::new(),
            messages: HashMap::new(),
            prompts: HashMap::new(),
            settings: HashMap::new(),
            users: HashMap::new(),
            counter: Counter {
                agent_counter: 0,
                agent_prompt_counter: 0,
                agent_of_counter: 0,
                chat_counter: 0,
                category_counter: 0,
                space_counter: 0,
                tag_counter: 0,
                message_counter: 0,
                prompt_counter: 0,
                setting_counter: 0,
                user_counter: 0,
            },
        }
    }

    fn get_next_id(&mut self, collection_name: &str) -> Result<u64, String> {
        match collection_name {
            "agent" => {
                self.counter.agent_counter += 1;
                Ok(self.counter.agent_counter)
            }
            "agent_prompt" => {
                self.counter.agent_prompt_counter += 1;
                Ok(self.counter.agent_prompt_counter)
            }
            "agent_ofs" => {
                self.counter.agent_of_counter += 1;
                Ok(self.counter.agent_of_counter)
            }
            "categories" => {
                self.counter.category_counter += 1;
                Ok(self.counter.category_counter)
            }
            "spaces" => {
                self.counter.space_counter += 1;
                Ok(self.counter.space_counter)
            }
            "tags" => {
                self.counter.tag_counter += 1;
                Ok(self.counter.tag_counter)
            }
            "prompts" => {
                self.counter.prompt_counter += 1;
                Ok(self.counter.prompt_counter)
            }
            "settings" => {
                self.counter.setting_counter += 1;
                Ok(self.counter.setting_counter)
            }
            "users" => {
                self.counter.user_counter += 1;
                Ok(self.counter.user_counter)
            }
            _ => Err("Unknown collection".to_string()),
        }
    }

    pub fn modify_data(
        &mut self,
        table_name: &str,
        action: &str,
        data: Value,
    ) -> Result<(), String> {
        let collection = match table_name {
            "agents" => Collection::Agents(&mut self.agent),
            "agent_prompts" => Collection::AgentPrompts(&mut self.agent_prompt),
            "agent_ofs" => Collection::AgentOfs(&mut self.agent_ofs),
            "chats" => Collection::Chats(&mut self.chats),
            "categories" => Collection::Categories(&mut self.categories),
            "spaces" => Collection::Spaces(&mut self.spaces),
            "tags" => Collection::Tags(&mut self.tags),
            "messages" => Collection::Messages(&mut self.messages),
            "prompts" => Collection::Prompts(&mut self.prompts),
            "settings" => Collection::Settings(&mut self.settings),
            "users" => Collection::Users(&mut self.users),
            _ => return Err(format!("Table {} not found", table_name)),
        };
        self.modify_collection(collection, action, data)
    }

    fn modify_collection(
        &mut self,
        collection: Collection,
        action: &str,
        data: Value,
    ) -> Result<(), String> {
        match collection {
            Collection::Agents(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::AgentPrompts(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::AgentOfs(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::Chats(collection) => self.modify_collection_inner(collection, action, data),
            Collection::Categories(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::Spaces(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::Tags(collection) => self.modify_collection_inner(collection, action, data),
            Collection::Messages(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::Prompts(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::Settings(collection) => {
                self.modify_collection_inner(collection, action, data)
            }
            Collection::Users(collection) => self.modify_collection_inner(collection, action, data),
        }
    }

    fn modify_collection_inner<T: serde::de::DeserializeOwned + Clone>(
        &mut self,
        collection: &mut HashMap<u64, T>,
        action: &str,
        data: Value,
    ) -> Result<(), String> {
        match action {
            "add" => {
                let item: T = serde_json::from_value(data).map_err(|e| e.to_string())?;
                let id = self.get_next_id(collection);
                collection.insert(id, item);
                Ok(())
            }
            "remove" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                collection.remove(&id);
                Ok(())
            }
            "update" => {
                let id = data["id"].as_u64().ok_or("Invalid ID")?;
                let item: T = serde_json::from_value(data).map_err(|e| e.to_string())?;
                collection.insert(id, item);
                Ok(())
            }
            _ => Err(format!("Action {} not supported", action)),
        }
    }
}
