"use client";

import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onSpace?: () => void;
  onDelete?: () => void;
  onNew?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or textareas
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Space - Play/Pause
      if (event.code === 'Space' && shortcuts.onSpace) {
        event.preventDefault();
        shortcuts.onSpace();
      }

      // Delete or Backspace - Delete current item
      if ((event.code === 'Delete' || event.code === 'Backspace') && shortcuts.onDelete) {
        event.preventDefault();
        shortcuts.onDelete();
      }

      // N - New recording
      if (event.code === 'KeyN' && !event.metaKey && !event.ctrlKey && shortcuts.onNew) {
        event.preventDefault();
        shortcuts.onNew();
      }

      // Escape - Stop recording or close dialogs
      if (event.code === 'Escape' && shortcuts.onEscape) {
        event.preventDefault();
        shortcuts.onEscape();
      }

      // ? - Show help
      if (event.code === 'Slash' && event.shiftKey && shortcuts.onHelp) {
        event.preventDefault();
        shortcuts.onHelp();
      }

      // Cmd+, or Ctrl+, - Open settings
      if (event.code === 'Comma' && (event.metaKey || event.ctrlKey) && shortcuts.onSettings) {
        event.preventDefault();
        shortcuts.onSettings();
      // Cmd+Shift+Z - Redo
      if (event.code === 'KeyZ' && event.metaKey && event.shiftKey && shortcuts.onRedo) {
        event.preventDefault();
        shortcuts.onRedo();
      }
      // Cmd+Z - Undo (check this after redo to avoid conflicts)
      else if (event.code === 'KeyZ' && event.metaKey && !event.shiftKey && shortcuts.onUndo) {
        event.preventDefault();
        shortcuts.onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
