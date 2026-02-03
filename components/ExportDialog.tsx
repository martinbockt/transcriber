'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { formatToMarkdown, formatToJSON, downloadAsFile, downloadAudioFile } from '@/lib/export';
import type { VoiceItem } from '@/types/voice-item';
import { invoke } from '@tauri-apps/api/core';
import { logError } from '@/lib/error-sanitizer';
import { useTranslation } from '@/components/language-provider';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VoiceItem[];
}

type ExportFormat = 'markdown' | 'json';

export function ExportDialog({ open, onOpenChange, items }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeAudio, setIncludeAudio] = useState(false);
  const { dictionary } = useTranslation();

  const handleExport = async () => {
    if (items.length === 0) return;

    try {
      // Prepare export content and metadata
      let content: string;
      let filename: string;
      let extension: string;
      let mimeType: string;

      if (items.length === 1) {
        // Single item export
        const item = items[0];
        content =
          format === 'markdown'
            ? formatToMarkdown(item, includeAudio)
            : formatToJSON(item, includeAudio);

        extension = format === 'markdown' ? 'md' : 'json';
        mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';
        filename = `${item.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      } else {
        // Multiple items export - combine into single file
        content =
          format === 'markdown'
            ? items.map((item) => formatToMarkdown(item, includeAudio)).join('\n\n---\n\n')
            : JSON.stringify(
                items.map((item) => JSON.parse(formatToJSON(item, includeAudio))),
                null,
                2,
              );

        extension = format === 'markdown' ? 'md' : 'json';
        mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';
        filename = `voice_items_export_${new Date().toISOString().split('T')[0]}.${extension}`;
      }

      // Detect if running in Tauri (desktop app) or browser
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

      if (isTauri) {
        // Use Tauri native file dialog
        const savedFilePath = (await invoke('save_file', {
          content,
          defaultFilename: filename,
          filters: [
            {
              name: format === 'markdown' ? 'Markdown Files' : 'JSON Files',
              extensions: [extension],
            },
          ],
        })) as string;

        // Download audio files separately if includeAudio is checked
        if (includeAudio && savedFilePath) {
          // Get the directory and base filename from the saved file
          // Handle both forward slashes (Unix) and backslashes (Windows)
          const lastSlashIndex = Math.max(
            savedFilePath.lastIndexOf('/'),
            savedFilePath.lastIndexOf('\\'),
          );
          const directory =
            lastSlashIndex !== -1 ? savedFilePath.substring(0, lastSlashIndex + 1) : '';

          for (let index = 0; index < items.length; index++) {
            const item = items[index];
            if (item.audioData) {
              // Extract base64 data from data URL
              const base64Match = item.audioData.match(/^data:[^;]+;base64,(.+)$/);
              if (base64Match) {
                const base64Data = base64Match[1];

                // Generate audio filename based on item title or index
                const audioFilename =
                  items.length === 1
                    ? `${item.title.replace(/[^a-z0-9]/gi, '_')}_audio.webm`
                    : `${item.title.replace(/[^a-z0-9]/gi, '_')}_${index + 1}_audio.webm`;

                // Save audio file in the same directory as the main file
                const audioFilePath = directory + audioFilename;

                await invoke('save_audio_file', {
                  base64Data,
                  filePath: audioFilePath,
                });
              }
            }
          }
        }
      } else {
        // Fallback to browser download
        downloadAsFile(content, filename, mimeType);

        // Download audio files separately if includeAudio is checked
        if (includeAudio) {
          items.forEach((item, index) => {
            if (item.audioData) {
              // Generate audio filename based on item title or index
              const audioFilename =
                items.length === 1
                  ? `${item.title.replace(/[^a-z0-9]/gi, '_')}_audio.webm`
                  : `${item.title.replace(/[^a-z0-9]/gi, '_')}_${index + 1}_audio.webm`;

              downloadAudioFile(item.audioData, audioFilename);
            }
          });
        }
      }

      onOpenChange(false);
    } catch (error) {
      // Only log error if it's not a user cancellation
      if (error !== 'User cancelled save dialog') {
        logError('Export failed', error);
      }
    }
  };

  const itemCount = items.length;
  const dialogTitle = itemCount === 1 ? 'Export Item' : `Export ${itemCount} Items`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {itemCount === 1
              ? dictionary.export.titleSingle
              : dictionary.export.titleMultiple.replace('{count}', itemCount.toString())}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 py-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {dictionary.common.format}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormat('markdown')}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      format === 'markdown'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setFormat('json')}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      format === 'json'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              {/* Include Audio Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-audio"
                  checked={includeAudio}
                  onCheckedChange={(checked) => setIncludeAudio(checked === true)}
                />
                <label
                  htmlFor="include-audio"
                  className="text-foreground text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {dictionary.common.includeAudio}
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {dictionary.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExport}>
            {dictionary.export.exportButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
