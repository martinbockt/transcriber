use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use machine_uid;
use sha2::{Digest, Sha256};

/// Generate a consistent 32-byte key based on the machine's unique ID
/// This replaces the OS Keyring to prevent UI blocking/hanging
fn get_machine_key() -> Result<[u8; 32], String> {
    let machine_id = machine_uid::get()
        .map_err(|e| format!("Could not get machine ID: {}", e))?;

    // Hash the machine ID to get a fixed-length 32-byte key
    let mut hasher = Sha256::new();
    hasher.update(machine_id.as_bytes());
    // Optional: Add a hardcoded "salt" specific to your app to ensure key uniqueness
    hasher.update(b"voice-assistant-v1-salt");

    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result);
    Ok(key)
}

/// Internal encryption function that accepts a key directly
/// Used for testing and by the public encrypt function
fn encrypt_with_key(data: &[u8], key: &[u8; 32]) -> Result<String, String> {
    let cipher = Aes256Gcm::new(key.into());

    // Generate random nonce (96-bits / 12 bytes for AES-GCM)
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    // Encrypt
    let ciphertext = cipher
        .encrypt(&nonce, data)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Combine nonce and ciphertext: [Nonce (12 bytes)] + [Ciphertext]
    let mut combined = nonce.to_vec();
    combined.extend(ciphertext);

    // Encode as base64
    Ok(general_purpose::STANDARD.encode(combined))
}

/// Internal decryption function that accepts a key directly
/// Used for testing and by the public decrypt function
fn decrypt_with_key(encrypted_str: &str, key: &[u8; 32]) -> Result<Vec<u8>, String> {
    // Decode base64
    let encrypted_data = general_purpose::STANDARD
        .decode(encrypted_str)
        .map_err(|e| format!("Invalid Base64: {}", e))?;

    if encrypted_data.len() < 12 {
        return Err("Data too short to contain nonce".to_string());
    }

    // Split nonce and ciphertext
    // AES-GCM Standard Nonce is 12 bytes
    let nonce = Nonce::from_slice(&encrypted_data[0..12]);
    let ciphertext = &encrypted_data[12..];

    let cipher = Aes256Gcm::new(key.into());

    // Decrypt
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))
}

/// Encrypt data using AES-256-GCM linked to this machine
/// Returns base64-encoded encrypted data with nonce prepended
pub fn encrypt(data: &[u8]) -> Result<String, String> {
    let key = get_machine_key()?;
    encrypt_with_key(data, &key)
}

/// Decrypt data using AES-256-GCM linked to this machine
/// Takes base64-encoded encrypted data with nonce prepended
pub fn decrypt(encrypted_data: &str) -> Result<Vec<u8>, String> {
    let key = get_machine_key()?;
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
        let result = decrypt_with_key("not-valid-base64!!!", &key);
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_too_short() {
        let key = test_key();
        let result = decrypt_with_key("YWJj", &key); // "abc" (3 bytes)
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("too short"));
    }

    #[test]
    fn test_decrypt_corrupted_data() {
        let key = test_key();
        let original = b"test data";
        let mut encrypted = encrypt_with_key(original, &key).expect("Encryption should succeed");

        // Corrupt the encrypted data
        if let Some(last_char) = encrypted.pop() {
            encrypted.push(if last_char == 'A' { 'B' } else { 'A' });
        }

        let result = decrypt_with_key(&encrypted, &key);
        assert!(result.is_err());
    }
}