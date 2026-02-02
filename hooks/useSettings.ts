"use client";

import { useState, useEffect } from 'react';
import { Settings, getSettings, saveSettings } from '@/lib/storage';
import { logError } from '@/lib/error-sanitizer';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    // Initialize with default values for SSR
    return { theme: 'system' };
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    async function loadSettings() {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
      setIsLoaded(true);
    }
    loadSettings();
  }, []);

  // Update settings function
  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      await saveSettings(newSettings);
      const updatedSettings = await getSettings();
      setSettings(updatedSettings);
    } catch (error) {
      logError('Failed to update settings', error);
      throw error;
    }
  };

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
