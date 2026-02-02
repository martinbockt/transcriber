use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::crypto;

/// Get the path to the secure storage file in the app's data directory
fn get_secure_storage_path(app: &AppHandle, key: &str) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Ensure the directory exists
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    // Create a secure subdirectory for sensitive data
    let secure_dir = app_data_dir.join("secure");
    fs::create_dir_all(&secure_dir)
        .map_err(|e| format!("Failed to create secure directory: {}", e))?;

    // Use a sanitized key as the filename
    let sanitized_key = key.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    Ok(secure_dir.join(sanitized_key))
}

/// Store a secure value (e.g., API key) in the app's secure storage
#[tauri::command]
pub async fn set_secure_value(
    app: AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    let file_path = get_secure_storage_path(&app, &key)?;

    // Encrypt the value before storing
    let encrypted_value = crypto::encrypt(value.as_bytes())?;

    fs::write(&file_path, encrypted_value.as_bytes())
        .map_err(|e| format!("Failed to write secure value: {}", e))?;

    // Set file permissions to be readable only by the owner (Unix-like systems)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&file_path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?
            .permissions();
        perms.set_mode(0o600); // Read/write for owner only
        fs::set_permissions(&file_path, perms)
            .map_err(|e| format!("Failed to set file permissions: {}", e))?;
    }

    Ok(())
}

/// Retrieve a secure value (e.g., API key) from the app's secure storage
#[tauri::command]
pub async fn get_secure_value(app: AppHandle, key: String) -> Result<String, String> {
    let file_path = get_secure_storage_path(&app, &key)?;

    if !file_path.exists() {
        return Ok(String::new());
    }

    let encrypted_value = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read secure value: {}", e))?;

    // Try to decrypt the value
    match crypto::decrypt(&encrypted_value) {
        Ok(decrypted_bytes) => {
            // Successfully decrypted - convert bytes to string
            String::from_utf8(decrypted_bytes)
                .map_err(|e| format!("Decrypted data is not valid UTF-8: {}", e))
        }
        Err(_) => {
            // Decryption failed - assume it's old plain text data
            // Migrate it to encrypted format for next time
            let plain_text_value = encrypted_value.clone();

            // Attempt to re-encrypt and save (best effort, don't fail if this doesn't work)
            if let Ok(encrypted) = crypto::encrypt(plain_text_value.as_bytes()) {
                let _ = fs::write(&file_path, encrypted.as_bytes());

                // Set file permissions again after migration (Unix-like systems)
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if let Ok(metadata) = fs::metadata(&file_path) {
                        let mut perms = metadata.permissions();
                        perms.set_mode(0o600);
                        let _ = fs::set_permissions(&file_path, perms);
                    }
                }
            }

            // Return the plain text value
            Ok(plain_text_value)
        }
    }
}

/// Delete a secure value from storage
#[tauri::command]
pub async fn delete_secure_value(app: AppHandle, key: String) -> Result<(), String> {
    let file_path = get_secure_storage_path(&app, &key)?;

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete secure value: {}", e))?;
    }

    Ok(())
}
