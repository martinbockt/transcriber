use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct FileDialogFilter {
    name: String,
    extensions: Vec<String>,
}

/// Save file command that opens a native save dialog and writes content to disk
#[tauri::command]
async fn save_file(
    app: tauri::AppHandle,
    content: String,
    default_filename: String,
    filters: Vec<FileDialogFilter>,
) -> Result<String, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

    // Build the file dialog with filters
    let mut dialog = app.dialog().file();

    // Set default filename
    dialog = dialog.set_file_name(&default_filename);

    // Add file filters - convert Vec<String> to Vec<&str>
    for filter in filters.iter() {
        let ext_refs: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
        dialog = dialog.add_filter(&filter.name, &ext_refs);
    }

    // Show save dialog and get the selected path
    let file_path = match dialog.blocking_save_file() {
        Some(path) => path,
        None => return Err("User cancelled save dialog".to_string()),
    };

    // Get the path string
    let path_string = file_path.to_string();
    let path = std::path::Path::new(&path_string);

    // Write content to the file
    match std::fs::write(path, content.as_bytes()) {
        Ok(_) => Ok(path_string),
        Err(e) => {
            // Show error dialog to user
            app.dialog()
                .message(format!("Failed to save file: {}", e))
                .kind(MessageDialogKind::Error)
                .blocking_show();
            Err(format!("Failed to write file: {}", e))
        }
    }
}

/// Toggle window visibility
#[tauri::command]
async fn toggle_window_visibility(window: tauri::Window) -> Result<(), String> {
    if window.is_visible().map_err(|e| e.to_string())? {
        window.hide().map_err(|e| e.to_string())?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

mod commands;
mod crypto;
mod audio;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(audio::AudioRecorder::default())
        .invoke_handler(tauri::generate_handler![
            save_file,
            toggle_window_visibility,
            commands::get_secure_value,
            commands::set_secure_value,
            commands::delete_secure_value,
            audio::start_recording,
            audio::stop_recording,
        ])
        .setup(|app| {
            use tauri::Manager;
            use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton};
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

            let window = app.get_webview_window("main").unwrap();

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }

            // Setup system tray
            let window_clone_tray = window.clone();
            let _tray = TrayIconBuilder::new()
                .tooltip("Voice Assistant")
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { button, .. } = event {
                        if button == MouseButton::Left {
                            let window = &window_clone_tray;
                            if window.is_visible().unwrap_or(true) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.unminimize();
                            }
                        }
                    }
                })
                .build(app)
                .expect("Failed to create tray icon");

            // Register global shortcut: Cmd+Shift+Space (macOS) / Ctrl+Shift+Space (Windows/Linux)
            let shortcut = if cfg!(target_os = "macos") {
                "CommandOrControl+Shift+Space"
            } else {
                "Control+Shift+Space"
            };

            // Clone window for the closure
            let window_clone = window.clone();

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let window = &window_clone;

                    // Toggle window visibility
                    if window.is_visible().unwrap_or(true) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
            }).expect("Failed to register global shortcut");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
