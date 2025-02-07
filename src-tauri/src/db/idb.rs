use crate::db::types::OperatorType;
use rocksdb::{IteratorMode, DB};
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub struct IdB {
    db: Arc<Mutex<DB>>,
}

impl IdB {
    pub fn new(db: Arc<Mutex<DB>>) -> Self {
        IdB { db }
    }

    pub fn get_one(&self, id: u64) -> Result<Option<Value>, String> {
        let key = id.to_string();
        let db = self.db.lock().map_err(|e| e.to_string())?;
        match db.get(key) {
            Ok(Some(value)) => {
                let value: Value = serde_json::from_slice(&value).map_err(|e| e.to_string())?;
                Ok(Some(value))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn get_all(&self) -> Result<Vec<Value>, String> {
        let mut results = Vec::new();
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let iter = db.iterator(IteratorMode::Start);
        for item in iter {
            let (_, value) = item?;
            let value: Value = serde_json::from_slice(&value).map_err(|e| e.to_string())?;
            results.push(value);
        }
        Ok(results)
    }

    pub fn add(&self, data: Value) -> Result<(), String> {
        let id = data["id"].as_u64().ok_or("Invalid ID")?;
        let key = id.to_string();
        let value = serde_json::to_vec(&data).map_err(|e| e.to_string())?;
        let db = self.db.lock().map_err(|e| e.to_string())?;
        db.put(key, value).map_err(|e| e.to_string())
    }

    pub fn delete(&self, id: u64) -> Result<(), String> {
        let key = id.to_string();
        let db = self.db.lock().map_err(|e| e.to_string())?;
        db.delete(key).map_err(|e| e.to_string())
    }

    pub fn update(&self, id: u64, data: Value) -> Result<(), String> {
        let key = id.to_string();
        let value = serde_json::to_vec(&data).map_err(|e| e.to_string())?;
        let db = self.db.lock().map_err(|e| e.to_string())?;
        db.put(key, value).map_err(|e| e.to_string())
    }

    pub fn where_query(&self, query: &HashMap<String, OperatorType>) -> Result<Vec<Value>, String> {
        let mut results = Vec::new();
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let iter = db.iterator(IteratorMode::Start);
        for item in iter {
            let (_, value) = item?;
            let value: Value = serde_json::from_slice(&value).map_err(|e| e.to_string())?;
            if self.matches_query(&value, query) {
                results.push(value);
            }
        }
        Ok(results)
    }

    pub fn update_where(
        &self,
        query: &HashMap<String, OperatorType>,
        data: Value,
    ) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let iter = db.iterator(IteratorMode::Start);
        for item in iter {
            let (key, value) = item?;
            let value: Value = serde_json::from_slice(&value).map_err(|e| e.to_string())?;
            if self.matches_query(&value, query) {
                let new_value = data.clone();
                let new_value = serde_json::to_vec(&new_value).map_err(|e| e.to_string())?;
                db.put(key, new_value).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    pub fn delete_where(&self, query: &HashMap<String, OperatorType>) -> Result<(), String> {
        let db = self.db.lock().map_err(|e| e.to_string())?;
        let iter = db.iterator(IteratorMode::Start);
        for item in iter {
            let (key, value) = item?;
            let value: Value = serde_json::from_slice(&value).map_err(|e| e.to_string())?;
            if self.matches_query(&value, query) {
                db.delete(key).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    fn matches_query(&self, value: &Value, query: &HashMap<String, OperatorType>) -> bool {
        for (key, operator) in query {
            let field_value = match value.get(key) {
                Some(v) => v,
                None => return false,
            };

            if let Some(eq) = &operator.eq {
                if field_value != eq {
                    return false;
                }
            }
            if let Some(gt) = &operator.gt {
                if !self.compare_values(field_value, gt, |a, b| a > b) {
                    return false;
                }
            }
            if let Some(gte) = &operator.gte {
                if !self.compare_values(field_value, gte, |a, b| a >= b) {
                    return false;
                }
            }
            if let Some(lt) = &operator.lt {
                if !self.compare_values(field_value, lt, |a, b| a < b) {
                    return false;
                }
            }
            if let Some(lte) = &operator.lte {
                if !self.compare_values(field_value, lte, |a, b| a <= b) {
                    return false;
                }
            }
            if let Some(ne) = &operator.ne {
                if field_value == ne {
                    return false;
                }
            }
            if let Some(r#in) = &operator.r#in {
                if !r#in.contains(field_value) {
                    return false;
                }
            }
            if let Some(nin) = &operator.nin {
                if nin.contains(field_value) {
                    return false;
                }
            }
            if let Some(contains) = &operator.contains {
                if !field_value.as_str().map_or(false, |s| s.contains(contains)) {
                    return false;
                }
            }
            if let Some(starts_with) = &operator.starts_with {
                if !field_value
                    .as_str()
                    .map_or(false, |s| s.starts_with(starts_with))
                {
                    return false;
                }
            }
            if let Some(ends_with) = &operator.ends_with {
                if !field_value
                    .as_str()
                    .map_or(false, |s| s.ends_with(ends_with))
                {
                    return false;
                }
            }
            if let Some(btw) = &operator.btw {
                if !self.compare_values(field_value, &btw.0, |a, b| a >= b)
                    || !self.compare_values(field_value, &btw.1, |a, b| a <= b)
                {
                    return false;
                }
            }
        }
        true
    }

    fn compare_values<F>(&self, a: &Value, b: &Value, cmp: F) -> bool
    where
        F: Fn(&f64, &f64) -> bool,
    {
        match (a.as_f64(), b.as_f64()) {
            (Some(a), Some(b)) => cmp(&a, &b),
            _ => false,
        }
    }
}
