"use client";

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
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
}

const STORAGE_KEY = 'openai_api_key';

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { theme, setTheme } = useTheme();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

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

            {/* Data Management Section - to be implemented in phase 4 */}
            <section>
              <h3 className="text-sm font-medium mb-3">Data Management</h3>
              <div className="text-sm text-muted-foreground">
                Storage usage and data management options will be added here
              </div>
            </section>

            <Separator />

            {/* Keyboard Shortcuts Section - to be implemented in phase 5 */}
            <section>
              <h3 className="text-sm font-medium mb-3">Keyboard Shortcuts</h3>
              <div className="text-sm text-muted-foreground">
                Keyboard shortcuts reference will be added here
              </div>
            </section>

            <Separator />

            {/* About Section - to be implemented in phase 5 */}
            <section>
              <h3 className="text-sm font-medium mb-3">About</h3>
              <div className="text-sm text-muted-foreground">
                Version info and links will be added here
              </div>
            </section>
          </div>
        </ScrollArea>
      </AlertDialogContent>
    </AlertDialog>
  );
}
