/**
 * Frontend cryptography utilities using Web Crypto API
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 * Matches backend encryption approach (src-tauri/src/crypto.rs)
 */

const ENCRYPTION_KEY_STORAGE = "voice-assistant-encryption-key";
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const NONCE_LENGTH = 12; // Standard for AES-GCM

/**
 * Gets or creates the master encryption key from localStorage
 * Stores as base64-encoded string for persistence across sessions
 * @returns Base64-encoded 32-byte key
 */
function getOrCreateMasterKey(): string {
  try {
    const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
    if (storedKey) {
      return storedKey;
    }

    // Generate new 32-byte (256-bit) random key
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);

    // Store as base64
    const keyBase64 = btoa(String.fromCharCode(...keyBytes));
    localStorage.setItem(ENCRYPTION_KEY_STORAGE, keyBase64);

    return keyBase64;
  } catch (err) {
    console.error("Failed to get or create master key:", err);
    throw new Error("Encryption key initialization failed");
  }
}

/**
 * Derives a CryptoKey from a master key and salt using PBKDF2
 * @param masterKey - Base64-encoded master key
 * @param salt - Salt bytes for key derivation
 * @returns CryptoKey suitable for AES-GCM encryption
 */
export async function deriveKey(
  masterKey: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  try {
    // Decode master key from base64
    const keyBytes = Uint8Array.from(atob(masterKey), (c) => c.charCodeAt(0));

    // Import master key as raw key material
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    // Derive AES-GCM key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );

    return derivedKey;
  } catch (err) {
    console.error("Key derivation failed:", err);
    throw new Error("Failed to derive encryption key");
  }
}

/**
 * Encrypts data using AES-256-GCM
 * Returns base64-encoded string with format: salt + nonce + ciphertext
 * @param data - Plain text string to encrypt
 * @returns Base64-encoded encrypted data
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const masterKey = getOrCreateMasterKey();

    // Generate random salt for key derivation
    const salt = new Uint8Array(SALT_LENGTH);
    crypto.getRandomValues(salt);

    // Derive encryption key
    const key = await deriveKey(masterKey, salt);

    // Generate random nonce (12 bytes for AES-GCM)
    const nonce = new Uint8Array(NONCE_LENGTH);
    crypto.getRandomValues(nonce);

    // Convert string to bytes
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
      },
      key,
      dataBytes,
    );

    // Combine salt + nonce + ciphertext
    const result = new Uint8Array(
      salt.length + nonce.length + ciphertext.byteLength,
    );
    result.set(salt, 0);
    result.set(nonce, salt.length);
    result.set(new Uint8Array(ciphertext), salt.length + nonce.length);

    // Encode as base64
    let binary = "";
    const len = result.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(result[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error("Encryption failed:", err);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts data using AES-256-GCM
 * Takes base64-encoded encrypted data with format: salt + nonce + ciphertext
 * @param encryptedData - Base64-encoded encrypted string
 * @returns Decrypted plain text string
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const masterKey = getOrCreateMasterKey();

    // Decode from base64
    const dataBytes = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // Check minimum length (16-byte salt + 12-byte nonce + ciphertext)
    const minLength = SALT_LENGTH + NONCE_LENGTH;
    if (dataBytes.length < minLength) {
      throw new Error("Encrypted data too short");
    }

    // Extract salt, nonce, and ciphertext
    const salt = new Uint8Array(dataBytes.slice(0, SALT_LENGTH));
    const nonce = dataBytes.slice(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH);
    const ciphertext = dataBytes.slice(SALT_LENGTH + NONCE_LENGTH);

    // Derive decryption key using same salt
    const key = await deriveKey(masterKey, salt);

    // Decrypt
    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce,
      },
      key,
      ciphertext,
    );

    // Convert bytes back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Clears the master encryption key from storage
 * WARNING: This will make all encrypted data unrecoverable
 * Should only be used when clearing all application data
 */
export function clearEncryptionKey(): void {
  try {
    localStorage.removeItem(ENCRYPTION_KEY_STORAGE);
  } catch (err) {
    console.error("Failed to clear encryption key:", err);
  }
}
