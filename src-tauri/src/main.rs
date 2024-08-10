// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod files;

use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use anyhow::{anyhow, Result};
use reqwest;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use tauri::Manager;
use url::Url;

fn main() {
    wollama::run();
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            server();
            // window.open_devtools();

            /* #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
              .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
                  apply_mica(&window, dark)
                    .expect("Unsupported platform! 'apply_mica' is only supported on Windows"); */

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![close_splashscreen])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}

#[tauri::command]
async fn close_splashscreen(window: tauri::WebviewWindow) {
    // Close splashscreen
    if let Some(splashscreen) = window.get_webview_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    // Show main window
    window.get_webview_window("main").unwrap().show().unwrap();
}

// create the error type that represents all errors possible in our program
/* #[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
} */

/* #[tauri::command]
async fn search_google(search_param: &str) -> Result<(), String> {
    let search_param_res = search_google_and_browse_results(search_param).await?;

    let search_result =
        serde_json::to_string(&search_param_res.map_err(|e| e.to_string().into())).unwrap();

    Ok(search_result)
} */

#[derive(Serialize, Deserialize)]
struct Message {
    content: String,
}

async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello, World!")
}

async fn echo(msg: web::Json<Message>) -> impl Responder {
    HttpResponse::Ok().json(msg.0)
}

async fn server() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(hello))
            .route("/echo", web::post().to(echo))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

#[derive(Serialize, Deserialize)]
struct SearchResult {
    title: String,
    content: String,
    url: String,
    host: String,
}

async fn search_google_and_browse_results(search_param: &str) -> Result<Vec<SearchResult>> {
    // Initialiser un vecteur pour stocker les résultats de la recherche
    let mut results = Vec::new();

    // Effectuer la recherche Google
    let search_url = format!(
        "https://www.google.fr/search?q={}",
        urlencoding::encode(search_param)
    );
    let client = reqwest::Client::new();
    let response = client.get(&search_url).send().await?;
    let body = response.text().await?;
    // Extraire les 4 premiers liens de résultats
    let document = Html::parse_document(&body);
    let selector =
        Selector::parse("div.yuRUbf > a").map_err(|e| anyhow!("Selector error: {}", e))?;
    let search_results: Vec<String> = document
        .select(&selector)
        .take(4)
        .filter_map(|element| element.value().attr("href").map(String::from))
        .collect();

    // Parcourir chaque résultat de recherche
    for (i, url) in search_results.iter().enumerate() {
        println!("Parcours du résultat {} : {}", i + 1, url);
        let result_response = client.get(url).send().await?;
        let content = result_response.text().await?;
        let host = Url::parse(url)?.host_str().unwrap_or("").to_string();

        // Traiter la page de résultat selon les besoins
        let title = get_page_title(&content)?;
        println!("Titre : {}", title);

        results.push(SearchResult {
            title,
            content,
            url: url.clone(),
            host,
        });
    }

    Ok(results)
}

fn get_page_title(html: &str) -> Result<String> {
    let document = Html::parse_document(html);
    let title_selector = Selector::parse("title").map_err(|e| anyhow!("Selector error: {}", e))?;
    let title = document
        .select(&title_selector)
        .next()
        .and_then(|element| element.text().next())
        .unwrap_or("Aucun titre trouvé")
        .to_string();
    Ok(title)
}
