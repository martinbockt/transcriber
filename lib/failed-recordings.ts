/**
 * Failed recordings storage module
 * Stores recordings that failed during processing for retry or recovery
 * All data is encrypted using AES-256-GCM encryption
 */

import { encryptData, decryptData } from '@/lib/crypto';
import { logError } from './error-sanitizer';

const FAILED_RECORDINGS_STORAGE_KEY = 'voice-assistant-failed-recordings';

/**
 * Represents a recording that failed during processing
 */
export interface FailedRecording {
  id: string; // UUID
  createdAt: string; // ISO timestamp when recording was created
  failedAt: string; // ISO timestamp when processing failed
  audioData: string; // Base64-encoded audio data
  transcript?: string; // Partial transcript if available
  errorMessage: string; // User-friendly error message
  errorType: 'transcription' | 'processing' | 'network' | 'unknown'; // Error category
  retryCount: number; // Number of retry attempts
  lastRetryAt?: string; // ISO timestamp of last retry attempt
}

/**
 * Retrieves all failed recordings from localStorage
 * Returns empty array if none exist or if decryption fails
 * @returns Array of failed recordings
 */
export async function getFailedRecordings(): Promise<FailedRecording[]> {
  try {
    const stored = localStorage.getItem(FAILED_RECORDINGS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      // Decrypt the stored data
      const decrypted = await decryptData(stored);
      const parsed = JSON.parse(decrypted);

      // Validate that it's an array
      if (!Array.isArray(parsed)) {
        logError('Failed recordings data is not an array', new Error('Invalid data format'));
        return [];
      }

      return parsed;
    } catch (decryptErr) {
      // Decryption failed - try parsing as plain JSON for backwards compatibility
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Re-save as encrypted
          await saveAllFailedRecordings(parsed);
          return parsed;
        }
      } catch (parseErr) {
        logError('Failed to parse failed recordings', parseErr);
      }
    }
  } catch (err) {
    logError('Failed to retrieve failed recordings', err);
  }
  return [];
}

/**
 * Saves a single failed recording to localStorage
 * Appends to existing failed recordings and encrypts all data
 * @param recording - The failed recording to save
 */
export async function saveFailedRecording(recording: FailedRecording): Promise<void> {
  try {
    // Get existing failed recordings
    const existingRecordings = await getFailedRecordings();

    // Check if recording with same ID already exists
    const existingIndex = existingRecordings.findIndex((r) => r.id === recording.id);

    if (existingIndex >= 0) {
      // Update existing recording
      existingRecordings[existingIndex] = recording;
    } else {
      // Add new recording to the beginning of the array
      existingRecordings.unshift(recording);
    }

    // Save all recordings
    await saveAllFailedRecordings(existingRecordings);
  } catch (err) {
    logError('Failed to save failed recording', err);
    throw err;
  }
}

/**
 * Deletes a specific failed recording by ID
 * @param recordingId - The ID of the recording to delete
 * @returns true if recording was deleted, false if not found
 */
export async function deleteFailedRecording(recordingId: string): Promise<boolean> {
  try {
    const existingRecordings = await getFailedRecordings();
    const initialLength = existingRecordings.length;

    // Filter out the recording with the specified ID
    const updatedRecordings = existingRecordings.filter((r) => r.id !== recordingId);

    // Check if anything was actually removed
    if (updatedRecordings.length === initialLength) {
      return false; // Recording not found
    }

    // Save updated list
    await saveAllFailedRecordings(updatedRecordings);
    return true;
  } catch (err) {
    logError('Failed to delete failed recording', err);
    throw err;
  }
}

/**
 * Deletes all failed recordings from localStorage
 */
export async function clearAllFailedRecordings(): Promise<void> {
  try {
    localStorage.removeItem(FAILED_RECORDINGS_STORAGE_KEY);
  } catch (err) {
    logError('Failed to clear failed recordings', err);
    throw err;
  }
}

/**
 * Gets count of failed recordings
 * @returns Number of failed recordings in storage
 */
export async function getFailedRecordingsCount(): Promise<number> {
  try {
    const recordings = await getFailedRecordings();
    return recordings.length;
  } catch (err) {
    logError('Failed to get failed recordings count', err);
    return 0;
  }
}

/**
 * Retrieves a specific failed recording by ID
 * @param recordingId - The ID of the recording to retrieve
 * @returns The failed recording or null if not found
 */
export async function getFailedRecordingById(recordingId: string): Promise<FailedRecording | null> {
  try {
    const recordings = await getFailedRecordings();
    const recording = recordings.find((r) => r.id === recordingId);
    return recording || null;
  } catch (err) {
    logError('Failed to get failed recording by ID', err);
    return null;
  }
}

/**
 * Internal helper to save all failed recordings with encryption
 * @param recordings - Array of failed recordings to save
 */
async function saveAllFailedRecordings(recordings: FailedRecording[]): Promise<void> {
  try {
    const jsonString = JSON.stringify(recordings);
    const encrypted = await encryptData(jsonString);
    localStorage.setItem(FAILED_RECORDINGS_STORAGE_KEY, encrypted);
  } catch (err) {
    logError('Failed to save all failed recordings', err);
    throw err;
  }
}
