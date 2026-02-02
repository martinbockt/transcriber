"use client";

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/theme-provider';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataCleared?: () => void;
}

const STORAGE_KEY = 'openai_api_key';
const APP_VERSION = '0.1.0';
const APP_NAME = 'Voice Assistant';

// Keyboard shortcuts reference
const shortcuts = [
  { key: 'N', description: 'Start new recording' },
  { key: 'Delete', description: 'Delete current recording' },
  { key: 'Backspace', description: 'Delete current recording (alt)' },
  { key: 'Escape', description: 'Stop recording' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Cmd+,', description: 'Open settings' },
];

// Utility function to calculate localStorage usage
const calculateStorageUsage = (): number => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      // Calculate size in bytes (UTF-16, 2 bytes per character)
      total += (key.length + value.length) * 2;
    }
  }
  return total;
};

// Utility function to format bytes to KB/MB
const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
};

export function SettingsDialog({ open, onOpenChange, onDataCleared }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [storageUsage, setStorageUsage] = useState<{ bytes: number; formatted: string }>({ bytes: 0, formatted: '0 KB' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { theme, setTheme } = useTheme();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Calculate storage usage when dialog opens or when save status changes
  useEffect(() => {
    if (open) {
      const bytes = calculateStorageUsage();
      setStorageUsage({
        bytes,
        formatted: formatStorageSize(bytes),
      });
    }
  }, [open, saveStatus, showClearConfirm]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Invalid API key');
      }

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to validate API key');
    }
  };

  const handleSaveApiKey = async () => {
    // Basic validation
    if (!apiKey.trim()) {
      setErrorMessage('API key cannot be empty');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // Validate OpenAI API key format (should start with sk-)
    if (!apiKey.startsWith('sk-')) {
      setErrorMessage('Invalid API key format. OpenAI keys should start with "sk-"');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // Validate API key with OpenAI
    setSaveStatus('validating');
    try {
      await validateApiKey(apiKey);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, apiKey);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate API key';
      setErrorMessage(message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleClearAllData = () => {
    // Clear all localStorage data
    localStorage.clear();

    // Reset API key input
    setApiKey('');

    // Close confirmation dialog
    setShowClearConfirm(false);

    // Notify parent component
    if (onDataCleared) {
      onDataCleared();
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle>Settings</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-foreground">
              Manage your preferences and application settings
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* API Key Section */}
            <section>
              <h3 className="text-sm font-medium mb-3">OpenAI API Key</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter your OpenAI API key to enable voice transcription and AI processing.
                  Your key is stored locally in your browser.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveApiKey}
                    variant={saveStatus === 'success' ? 'default' : 'outline'}
                    disabled={saveStatus === 'validating'}
                  >
                    {saveStatus === 'validating' ? 'Validating...' : saveStatus === 'success' ? 'Saved!' : 'Save'}
                  </Button>
                </div>
                {saveStatus === 'error' && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                )}
                {saveStatus === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    API key saved successfully
                  </p>
                )}
              </div>
            </section>

            <Separator />

            {/* Preferences Section */}
            <section>
              <h3 className="text-sm font-medium mb-3">Preferences</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-toggle">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color theme for the application
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex-1"
                    >
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex-1"
                    >
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="flex-1"
                    >
                      System
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Data Management Section */}
            <section>
              <h3 className="text-sm font-medium mb-3">Data Management</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Usage</Label>
                  <p className="text-sm text-muted-foreground">
                    Local storage used by this application
                  </p>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm">Total Usage</span>
                    <span className="text-sm font-medium">{storageUsage.formatted}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Clear Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove all recordings, settings, and stored data from your browser
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full"
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>
            </section>

            <Separator />

            {/* Keyboard Shortcuts Section */}
            <section>
              <h3 className="text-sm font-medium mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* About Section */}
            <section>
              <h3 className="text-sm font-medium mb-3">About</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm font-medium">{APP_NAME}</span>
                    <span className="text-sm text-muted-foreground">v{APP_VERSION}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  A voice-powered assistant that transcribes and processes your audio recordings using OpenAI's advanced AI technology.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open('https://github.com/yourusername/voice-assistant#readme', '_blank')}
                  >
                    Documentation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open('https://github.com/yourusername/voice-assistant', '_blank')}
                  >
                    GitHub Repository
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </AlertDialogContent>

      {/* Clear All Data Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your recordings, settings, and stored data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialog>
  );
}
