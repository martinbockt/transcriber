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
    console.error('Failed to parse stored settings:', err);
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
    console.error('Failed to save settings:', err);
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
    console.error('Failed to clear settings:', err);
    throw err;
  }
}
