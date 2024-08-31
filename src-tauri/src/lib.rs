use anyhow::{Result};
use log::{debug, error, info};
use reqwest;
use scraper::{Html, Selector};
use std::process::Command;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            tauri::async_runtime::spawn(async move {
                let output = Command::new("node")
                    .arg("run-module.js")
                    .output()
                    .expect("Failed to execute Node.js script");

                if !output.status.success() {
                    eprintln!(
                        "Node.js script error: {}",
                        String::from_utf8_lossy(&output.stderr)
                    );
                }
            });
            //server();
            // window.open_devtools();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![fetch_url_content])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}

#[tauri::command]
async fn fetch_url_content(url: String) -> Result<String, String> {
    println!("Tentative de récupération du contenu de l'URL : {}", url);

    let client = reqwest::Client::new();
    let response = match client.get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .send()
        .await {
            Ok(resp) => resp,
            Err(e) => {
                error!("Failed to send request to {}: {}", url, e);
                return Err(e.to_string());
            }
        };

    println!("Received response with status: {}", response.status());

    if !response.status().is_success() {
        let error_msg = format!("HTTP error! status: {}", response.status());
        error!("{}", error_msg);
        return Err(error_msg);
    }

    let body = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            error!("Failed to get response body from {}: {}", url, e);
            return Err(e.to_string());
        }
    };

    println!(
        "Contenu récupéré avec succès. Longueur : {} caractères",
        body.len()
    );

    // Parse the HTML and extract the main content
    let document = Html::parse_document(&body);
    let selector = Selector::parse("body").unwrap();
    let content = document
        .select(&selector)
        .next()
        .and_then(|element| Some(element.text().collect::<Vec<_>>().join(" ")))
        .unwrap_or_else(|| "No content found".to_string());

    debug!("Extracted content length: {} characters", content.len());

    // Limit the content to 1000 characters
    let truncated_content: String = content.chars().take(1000).collect();

    info!(
        "Successfully fetched and processed content from URL: {}",
        url
    );
    debug!(
        "Truncated content length: {} characters",
        truncated_content.len()
    );

    Ok(truncated_content)
}
