'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
import { getStorageUsage } from '@/lib/storage';
import { X, Shield, Eye, EyeOff } from 'lucide-react';
import { logError } from '@/lib/error-sanitizer';
import { useTranslation } from '@/components/language-provider';
import { useRouter, usePathname } from 'next/navigation';
import { i18n } from '@/i18n-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [storageUsage, setStorageUsage] = useState<{
    bytes: number;
    formatted: string;
  }>({ bytes: 0, formatted: '0 KB' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const { dictionary, locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    const segments = pathname.split('/');
    if (segments.length > 1 && i18n.locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    // Persist preference
    localStorage.setItem('i18nextLng', newLocale);

    const newPath = segments.join('/');
    router.push(newPath);
  };

  // Load API key from Tauri secure storage on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedKey = await invoke<string>('get_secure_value', {
          key: STORAGE_KEY,
        });
        if (savedKey) {
          setApiKey(savedKey);
        }
      } catch (error) {
        logError('Failed to load API key', error);
      }
    };
    loadApiKey();
  }, []);

  // Calculate storage usage when dialog opens or when save status changes
  useEffect(() => {
    if (open) {
      const usage = getStorageUsage();
      setStorageUsage({
        bytes: usage.used,
        formatted: formatStorageSize(usage.used),
      });
    }
  }, [open, saveStatus, showClearConfirm]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    // Create AbortController with 10 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Invalid API key');
      }

      return true;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Validation timed out. Please check your internet connection.');
        }
        throw new Error(error.message);
      }
      throw new Error('Failed to validate API key');
    }
  };

  const handleSaveApiKey = async () => {
    // Basic validation
    if (!apiKey.trim()) {
      setErrorMessage(dictionary.errors.apiKeyEmpty);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // Validate OpenAI API key format (should start with sk-)
    if (!apiKey.startsWith('sk-')) {
      setErrorMessage(dictionary.errors.apiKeyInvalidFormat);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    // Validate API key with OpenAI
    setSaveStatus('validating');
    try {
      console.log('Starting API key validation...');
      await validateApiKey(apiKey);
      console.log('API key validation successful');

      // Save to Tauri secure storage with timeout
      console.log('Saving API key to secure storage...');
      const savePromise = invoke('set_secure_value', {
        key: STORAGE_KEY,
        value: apiKey,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                'Storage operation timed out after 30 seconds. Please check if there are any permission dialogs waiting for your response.',
              ),
            ),
          30000,
        );
      });

      await Promise.race([savePromise, timeoutPromise]);
      console.log('API key saved successfully');

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save API key:', error);
      const message =
        error instanceof Error ? error.message : dictionary.errors.apiKeyValidationFailed;
      setErrorMessage(message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      logError('Failed to save API key', error);
    }
  };

  const handleClearAllData = async () => {
    // Clear API key from secure storage
    try {
      await invoke('delete_secure_value', { key: STORAGE_KEY });
    } catch (error) {
      logError('Failed to delete API key from secure storage', error);
    }

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
      <AlertDialogContent className="max-h-[80vh] max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{dictionary.settings.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-foreground">Manage your preferences and application settings</div>
          </AlertDialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </AlertDialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* API Key Section */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-medium">OpenAI API Key</h3>
                <div className="flex items-center gap-1 rounded-md border border-green-300 bg-green-100 px-2 py-0.5 dark:border-green-700 dark:bg-green-900/30">
                  <Shield className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Encrypted
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Enter your OpenAI API key to enable voice transcription and AI processing. Your
                  key is stored securely using OS-level encryption (keychain/keyring).
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                      tabIndex={-1}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showApiKey ? dictionary.settings.hideApiKey : dictionary.settings.showApiKey}
                      </span>
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveApiKey}
                    variant={saveStatus === 'success' ? 'default' : 'outline'}
                    disabled={saveStatus === 'validating'}
                  >
                    {saveStatus === 'validating'
                      ? 'Validating...'
                      : saveStatus === 'success'
                        ? 'Saved!'
                        : 'Save'}
                  </Button>
                </div>
                {saveStatus === 'error' && (
                  <p className="text-destructive text-sm">{errorMessage}</p>
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
              <h3 className="mb-3 text-sm font-medium">Preferences</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{dictionary.settings.language}</Label>
                  <Select value={locale} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="pl">Polski</SelectItem>
                      <SelectItem value="sv">Svenska</SelectItem>
                      <SelectItem value="fi">Suomi</SelectItem>
                      <SelectItem value="da">Dansk</SelectItem>
                      <SelectItem value="cs">Čeština</SelectItem>
                      <SelectItem value="el">Ελληνικά</SelectItem>
                      <SelectItem value="hu">Magyar</SelectItem>
                      <SelectItem value="ro">Română</SelectItem>
                      <SelectItem value="bg">Български</SelectItem>
                      <SelectItem value="hr">Hrvatski</SelectItem>
                      <SelectItem value="sk">Slovenčina</SelectItem>
                      <SelectItem value="sl">Slovenščina</SelectItem>
                      <SelectItem value="et">Eesti</SelectItem>
                      <SelectItem value="lv">Latviešu</SelectItem>
                      <SelectItem value="lt">Lietuvių</SelectItem>
                      <SelectItem value="mt">Malti</SelectItem>
                      <SelectItem value="ga">Gaeilge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme-toggle">{dictionary.settings.theme}</Label>
                  <p className="text-muted-foreground text-sm">
                    Choose your preferred color theme for the application
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex-1"
                    >
                      {dictionary.settings.light}
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex-1"
                    >
                      {dictionary.settings.dark}
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="flex-1"
                    >
                      {dictionary.settings.system}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Data Management Section */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-medium">Data Management</h3>
                <div className="flex items-center gap-1 rounded-md border border-green-300 bg-green-100 px-2 py-0.5 dark:border-green-700 dark:bg-green-900/30">
                  <Shield className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Encrypted at Rest
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Usage</Label>
                  <p className="text-muted-foreground text-sm">
                    All recordings and transcripts are encrypted at rest using AES-256-GCM
                    encryption
                  </p>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm">Total Usage</span>
                    <span className="text-sm font-medium">{storageUsage.formatted}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Clear Data</Label>
                  <p className="text-muted-foreground text-sm">
                    Remove all recordings, settings, and encrypted data from local storage and
                    secure keychain
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
              <h3 className="mb-3 text-sm font-medium">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="group bg-card hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <span className="text-foreground text-sm font-medium">
                      {shortcut.description}
                    </span>
                    <kbd className="text-foreground bg-muted/80 border-border group-hover:border-primary/50 ml-3 rounded-md border-2 px-3 py-1.5 text-xs font-bold shadow-sm transition-colors">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* About Section */}
            <section>
              <h3 className="mb-3 text-sm font-medium">About</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium">{APP_NAME}</span>
                    <span className="text-muted-foreground text-sm">v{APP_VERSION}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  A voice-powered assistant that transcribes and processes your audio recordings
                  using OpenAI&apos;s advanced AI technology.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Replace with actual documentation URL
                      alert(
                        'Documentation link not configured. Please add your documentation URL.',
                      );
                    }}
                  >
                    Documentation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Replace with actual GitHub repository URL
                      alert(
                        'GitHub repository link not configured. Please add your repository URL.',
                      );
                    }}
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
              This will permanently delete all your recordings, settings, and encrypted data from
              both local storage and secure keychain. This action cannot be undone.
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
