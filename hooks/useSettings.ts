"use client";

import { useState, useEffect } from 'react';
import { Settings, getSettings, saveSettings } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    // Initialize with default values for SSR
    return { theme: 'system' };
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    setIsLoaded(true);
  }, []);

  // Update settings function
  const updateSettings = (newSettings: Partial<Settings>) => {
    try {
      saveSettings(newSettings);
      const updatedSettings = getSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
