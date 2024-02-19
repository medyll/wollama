
use tauri::{Manager,  WebviewWindow};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()    
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();

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


/* .setup(|app| {
      let window = app.get_webview_window("main").unwrap();
      #[cfg(target_os = "macos")]
apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None).expect("Unsupported platform!");

#[cfg(target_os = "windows")]
apply_blur(&window, Some((18, 18, 18, 125))).expect("Unsupported platform");

 Ok(())
    }) */


    
        /* .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_persisted_scope::init()) */