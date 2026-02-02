"use client";

import { useEffect } from 'react';
import { Theme } from '@/lib/storage';
import { useSettings } from './useSettings';

export function useTheme() {
  const { settings, updateSettings, isLoaded } = useSettings();

  // Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;

    const applyTheme = (theme: Theme) => {
      const root = window.document.documentElement;

      // Remove existing theme classes
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        // Detect system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        // Apply explicit theme
        root.classList.add(theme);
      }
    };

    applyTheme(settings.theme);

    // Listen for system theme changes when in system mode
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Legacy browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [settings.theme, isLoaded]);

  // Update theme function
  const setTheme = (theme: Theme) => {
    try {
      updateSettings({ theme });
    } catch (error) {
      console.error('Failed to update theme:', error);
      throw error;
    }
  };

  return {
    theme: settings.theme,
    setTheme,
    isLoaded,
  };
}
