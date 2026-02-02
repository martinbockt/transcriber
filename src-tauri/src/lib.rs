use tauri::Manager;
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

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            save_file,
            commands::get_secure_value,
            commands::set_secure_value,
            commands::delete_secure_value,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
