use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// Import necessary traits for Unix permission handling
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;

use crate::crypto;

/// Get the path to the secure storage file in the app's data directory
fn get_secure_storage_path(app: &AppHandle, key: &str) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let secure_dir = app_data_dir.join("secure");
    
    if !secure_dir.exists() {
        fs::create_dir_all(&secure_dir)
            .map_err(|e| format!("Failed to create secure directory: {}", e))?;
    }

    let sanitized_key = key.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    Ok(secure_dir.join(sanitized_key))
}

#[tauri::command]
pub async fn set_secure_value(
    app: AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let file_path = get_secure_storage_path(&app, &key)?;

        // This now calls the NEW crypto::encrypt (Machine ID based)
        let encrypted_value = crypto::encrypt(value.as_bytes())?;
        
        let mut options = OpenOptions::new();
        options.write(true).create(true).truncate(true);

        #[cfg(unix)]
        options.mode(0o600);

        let mut file = options
            .open(&file_path)
            .map_err(|e| format!("Failed to open secure file: {}", e))?;

        file.write_all(encrypted_value.as_bytes())
            .map_err(|e| format!("Failed to write data: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn get_secure_value(app: AppHandle, key: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let file_path = get_secure_storage_path(&app, &key)?;

        if !file_path.exists() {
            return Ok(String::new());
        }

        let file_content = fs::read(&file_path)
            .map_err(|e| format!("Failed to read secure value: {}", e))?;

        let encrypted_string = String::from_utf8(file_content)
            .map_err(|e| format!("Invalid UTF-8 in secure storage: {}", e))?;

        // This now calls the NEW crypto::decrypt (Machine ID based)
        match crypto::decrypt(&encrypted_string) {
            Ok(decrypted_bytes) => {
                String::from_utf8(decrypted_bytes)
                    .map_err(|e| format!("Decrypted data is not valid UTF-8: {}", e))
            },
            Err(e) => Err(format!("Failed to decrypt secure value: {}", e))
        }
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
pub async fn delete_secure_value(app: AppHandle, key: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let file_path = get_secure_storage_path(&app, &key)?;

        if file_path.exists() {
            fs::remove_file(&file_path)
                .map_err(|e| format!("Failed to delete secure value: {}", e))?;
        }

        Ok(())
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))?
}