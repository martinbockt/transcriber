"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { key: 'N', description: 'Start new recording' },
  { key: 'Delete', description: 'Delete current recording' },
  { key: 'Backspace', description: 'Delete current recording (alt)' },
  { key: 'Escape', description: 'Stop recording' },
  { key: '?', description: 'Show this help dialog' },
];

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keyboard Shortcuts</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 py-4">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
