import { logError } from './error-sanitizer';

export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  apiKey?: string;
  theme: Theme;
}

const SETTINGS_STORAGE_KEY = 'voice-assistant-settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
};

/**
 * Retrieves settings from localStorage
 * Returns default settings if none exist or if parsing fails
 */
export function getSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    logError('Failed to parse stored settings', err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Saves settings to localStorage
 * @param settings - Partial settings object (only changed values need to be provided)
 */
export function saveSettings(settings: Partial<Settings>): void {
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
  } catch (err) {
    logError('Failed to save settings', err);
    throw err;
  }
}

/**
 * Clears all settings from localStorage
 * Resets to default settings
 */
export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (err) {
    logError('Failed to clear settings', err);
    throw err;
  }
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  used: number; // bytes used
  total: number; // total bytes available (estimate)
  percentage: number; // percentage used
  itemCount: number; // number of items in storage
}

/**
 * Calculates the size of a string in bytes
 * @param str - The string to measure
 * @returns Size in bytes
 */
export function calculateStorageSize(str: string): number {
  try {
    // Use Blob to accurately calculate byte size (handles multi-byte characters)
    return new Blob([str]).size;
  } catch (err) {
    logError('Failed to calculate storage size', err);
    // Fallback: estimate 2 bytes per character for UTF-16
    return str.length * 2;
  }
}

/**
 * Retrieves current localStorage usage information
 * @returns Storage usage statistics
 */
export function getStorageUsage(): StorageUsage {
  try {
    let totalSize = 0;
    let itemCount = 0;

    // Calculate size of all items in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Calculate size of both key and value
          totalSize += calculateStorageSize(key);
          totalSize += calculateStorageSize(value);
          itemCount++;
        }
      }
    }

    // Most browsers provide ~5-10MB for localStorage
    // Use 5MB (5 * 1024 * 1024 bytes) as conservative estimate
    const estimatedTotal = 5 * 1024 * 1024;
    const percentage = (totalSize / estimatedTotal) * 100;

    return {
      used: totalSize,
      total: estimatedTotal,
      percentage: Math.min(percentage, 100), // Cap at 100%
      itemCount,
    };
  } catch (err) {
    logError('Failed to get storage usage', err);
    return {
      used: 0,
      total: 5 * 1024 * 1024,
      percentage: 0,
      itemCount: 0,
    };
  }
}
