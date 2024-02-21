
use tauri::{Manager};
use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()    
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();

      /* #[cfg(target_os = "macos")]
      apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

      #[cfg(target_os = "windows")]
            apply_mica(&window, dark)
              .expect("Unsupported platform! 'apply_mica' is only supported on Windows"); */
            
      Ok(())
    })
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