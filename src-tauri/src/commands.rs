use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

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

    fs::write(&file_path, value.as_bytes())
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

    let value = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read secure value: {}", e))?;

    Ok(value)
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
