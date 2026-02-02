use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{Engine as _, engine::general_purpose};
use keyring::Entry;

const SERVICE_NAME: &str = "voice-assistant";
const KEY_NAME: &str = "encryption-key";

/// Get or create the encryption key from OS keyring
/// Returns a 32-byte key for AES-256
fn get_or_create_key() -> Result<[u8; 32], String> {
    let entry = Entry::new(SERVICE_NAME, KEY_NAME)
        .map_err(|e| format!("Failed to access keyring: {}", e))?;

    // Try to get existing key
    match entry.get_password() {
        Ok(key_str) => {
            // Decode base64 key
            let key_bytes = general_purpose::STANDARD
                .decode(key_str)
                .map_err(|e| format!("Failed to decode stored key: {}", e))?;

            if key_bytes.len() != 32 {
                return Err("Stored key has invalid length".to_string());
            }

            let mut key = [0u8; 32];
            key.copy_from_slice(&key_bytes);
            Ok(key)
        }
        Err(_) => {
            // Generate new key
            let key = Aes256Gcm::generate_key(&mut OsRng);
            let key_bytes: [u8; 32] = key.into();

            // Store key in keyring
            let key_str = general_purpose::STANDARD.encode(key_bytes);
            entry.set_password(&key_str)
                .map_err(|e| format!("Failed to store key in keyring: {}", e))?;

            Ok(key_bytes)
        }
    }
}

/// Internal encryption function that accepts a key directly
/// Used for testing and by the public encrypt function
fn encrypt_with_key(data: &[u8], key: &[u8; 32]) -> Result<String, String> {
    let cipher = Aes256Gcm::new(key.into());

    // Generate random nonce (12 bytes for AES-GCM)
    let nonce_bytes = Aes256Gcm::generate_nonce(&mut OsRng);

    // Encrypt
    let ciphertext = cipher
        .encrypt(&nonce_bytes, data)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Prepend nonce to ciphertext
    let mut result = Vec::with_capacity(nonce_bytes.len() + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    // Encode as base64
    Ok(general_purpose::STANDARD.encode(result))
}

/// Internal decryption function that accepts a key directly
/// Used for testing and by the public decrypt function
fn decrypt_with_key(encrypted_data: &str, key: &[u8; 32]) -> Result<Vec<u8>, String> {
    // Decode base64
    let data = general_purpose::STANDARD
        .decode(encrypted_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Check minimum length (12-byte nonce + at least some ciphertext)
    if data.len() < 12 {
        return Err("Encrypted data too short".to_string());
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext) = data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Create cipher
    let cipher = Aes256Gcm::new(key.into());

    // Decrypt
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))
}

/// Encrypt data using AES-256-GCM
/// Returns base64-encoded encrypted data with nonce prepended
pub fn encrypt(data: &[u8]) -> Result<String, String> {
    let key = get_or_create_key()?;
    encrypt_with_key(data, &key)
}

/// Decrypt data using AES-256-GCM
/// Takes base64-encoded encrypted data with nonce prepended
pub fn decrypt(encrypted_data: &str) -> Result<Vec<u8>, String> {
    let key = get_or_create_key()?;
    decrypt_with_key(encrypted_data, &key)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Test helper: generate a test key
    fn test_key() -> [u8; 32] {
        [42u8; 32] // Fixed key for testing
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let original_data = b"Hello, this is sensitive data!";
        let key = test_key();

        // Encrypt
        let encrypted = encrypt_with_key(original_data, &key)
            .expect("Encryption should succeed");

        // Verify encrypted data is different from original
        assert_ne!(encrypted, String::from_utf8_lossy(original_data));

        // Decrypt
        let decrypted = decrypt_with_key(&encrypted, &key)
            .expect("Decryption should succeed");

        // Verify decrypted matches original
        assert_eq!(decrypted, original_data);
    }

    #[test]
    fn test_encrypt_produces_different_ciphertext() {
        let data = b"Same data";
        let key = test_key();

        let encrypted1 = encrypt_with_key(data, &key).expect("Encryption should succeed");
        let encrypted2 = encrypt_with_key(data, &key).expect("Encryption should succeed");

        // Due to random nonce, same plaintext should produce different ciphertext
        assert_ne!(encrypted1, encrypted2);

        // But both should decrypt to same plaintext
        let decrypted1 = decrypt_with_key(&encrypted1, &key).expect("Decryption should succeed");
        let decrypted2 = decrypt_with_key(&encrypted2, &key).expect("Decryption should succeed");
        assert_eq!(decrypted1, decrypted2);
        assert_eq!(decrypted1, data);
    }

    #[test]
    fn test_decrypt_invalid_base64() {
        let key = test_key();
        // Test with invalid base64
        let result = decrypt_with_key("not-valid-base64!!!", &key);
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_too_short() {
        let key = test_key();
        // Test with too-short data (less than 12 bytes for nonce)
        let result = decrypt_with_key("YWJj", &key); // "abc" in base64 (only 3 bytes)
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("too short"));
    }

    #[test]
    fn test_decrypt_corrupted_data() {
        let key = test_key();
        // Encrypt valid data
        let original = b"test data";
        let mut encrypted = encrypt_with_key(original, &key).expect("Encryption should succeed");

        // Corrupt the encrypted data by modifying a character
        // This should cause authentication failure in GCM
        if let Some(last_char) = encrypted.pop() {
            encrypted.push(if last_char == 'A' { 'B' } else { 'A' });
        }

        // Attempt to decrypt corrupted data
        let result = decrypt_with_key(&encrypted, &key);
        assert!(result.is_err());
    }

    #[test]
    fn test_encrypt_empty_data() {
        let key = test_key();
        let empty_data = b"";

        let encrypted = encrypt_with_key(empty_data, &key)
            .expect("Should encrypt empty data");

        let decrypted = decrypt_with_key(&encrypted, &key)
            .expect("Should decrypt empty data");

        assert_eq!(decrypted, empty_data);
    }

    #[test]
    fn test_encrypt_large_data() {
        let key = test_key();
        // Test with larger data (1MB)
        let large_data = vec![42u8; 1024 * 1024];

        let encrypted = encrypt_with_key(&large_data, &key)
            .expect("Should encrypt large data");

        let decrypted = decrypt_with_key(&encrypted, &key)
            .expect("Should decrypt large data");

        assert_eq!(decrypted, large_data);
    }
}
