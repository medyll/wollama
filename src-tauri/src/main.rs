// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager};
use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

fn main() {
  wollama::run();
  tauri::Builder::default()    
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();

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

/* .plugin(tauri_plugin_window_state::Builder::default().build())
.plugin(tauri_plugin_persisted_scope::init()) */