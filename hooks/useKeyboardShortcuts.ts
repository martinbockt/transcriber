'use client';

import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onSpace?: () => void;
  onDelete?: () => void;
  onNew?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd+K / Ctrl+K - Focus search (works globally)
      if (event.code === 'KeyK' && (event.metaKey || event.ctrlKey) && shortcuts.onSearch) {
        event.preventDefault();
        shortcuts.onSearch();
        return;
      }

      // Escape - Works in inputs (for clearing search) and globally (for stopping recording)
      if (event.code === 'Escape' && shortcuts.onEscape) {
        event.preventDefault();
        shortcuts.onEscape();
        return;
      }

      // Don't trigger other shortcuts when typing in inputs or textareas
      if (isInInput) {
        return;
      }

      // Space - Play/Pause
      if (event.code === 'Space' && shortcuts.onSpace) {
        event.preventDefault();
        shortcuts.onSpace();
      }

      // Arrow Left - Rewind
      if (event.code === 'ArrowLeft' && shortcuts.onArrowLeft) {
        event.preventDefault();
        shortcuts.onArrowLeft();
      }

      // Arrow Right - Fast forward
      if (event.code === 'ArrowRight' && shortcuts.onArrowRight) {
        event.preventDefault();
        shortcuts.onArrowRight();
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

      // ? - Show help
      if (event.code === 'Slash' && event.shiftKey && shortcuts.onHelp) {
        event.preventDefault();
        shortcuts.onHelp();
      }

      // Cmd+, or Ctrl+, - Open settings
      if (event.code === 'Comma' && (event.metaKey || event.ctrlKey) && shortcuts.onSettings) {
        event.preventDefault();
        shortcuts.onSettings();
      }
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
