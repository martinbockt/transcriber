"use client";

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
import { formatToMarkdown, formatToJSON, downloadAsFile } from '@/lib/export';
import type { VoiceItem } from '@/types/voice-item';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VoiceItem[];
}

type ExportFormat = 'markdown' | 'json';

export function ExportDialog({ open, onOpenChange, items }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeAudio, setIncludeAudio] = useState(false);

  const handleExport = () => {
    if (items.length === 0) return;

    try {
      if (items.length === 1) {
        // Single item export
        const item = items[0];
        const content = format === 'markdown'
          ? formatToMarkdown(item, includeAudio)
          : formatToJSON(item, includeAudio);

        const extension = format === 'markdown' ? 'md' : 'json';
        const mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';
        const filename = `${item.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;

        downloadAsFile(content, filename, mimeType);
      } else {
        // Multiple items export - combine into single file
        const content = format === 'markdown'
          ? items.map(item => formatToMarkdown(item, includeAudio)).join('\n\n---\n\n')
          : JSON.stringify(items.map(item => JSON.parse(formatToJSON(item, includeAudio))), null, 2);

        const extension = format === 'markdown' ? 'md' : 'json';
        const mimeType = format === 'markdown' ? 'text/markdown' : 'application/json';
        const filename = `voice_items_export_${new Date().toISOString().split('T')[0]}.${extension}`;

        downloadAsFile(content, filename, mimeType);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const itemCount = items.length;
  const dialogTitle = itemCount === 1 ? 'Export Item' : `Export ${itemCount} Items`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 py-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormat('markdown')}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                      format === 'markdown'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setFormat('json')}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
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
                  className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include audio data
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExport}>
            Export
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
