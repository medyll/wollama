use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Deserialize)]
pub struct OperatorType {
    pub eq: Option<Value>,
    pub gt: Option<Value>,
    pub gte: Option<Value>,
    pub lt: Option<Value>,
    pub lte: Option<Value>,
    pub ne: Option<Value>,
    pub r#in: Option<Vec<Value>>,
    pub nin: Option<Vec<Value>>,
    pub contains: Option<String>,
    pub starts_with: Option<String>,
    pub ends_with: Option<String>,
    pub btw: Option<(Value, Value)>,
}
