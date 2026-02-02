"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DetailView } from '@/components/DetailView';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { processVoiceRecording } from '@/lib/ai';
import { MOCK_HISTORY } from '@/lib/mock-data';
import type { VoiceItem } from '@/types/voice-item';

const STORAGE_KEY = 'voice-assistant-history';

export default function Home() {
  const [items, setItems] = useState<VoiceItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { isRecording, audioBlob, start, stop, error: recorderError } = useAudioRecorder();

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        if (parsed.length > 0) {
          setActiveItemId(parsed[0].id);
        }
      } catch (err) {
        console.error('Failed to parse stored items:', err);
        // Fallback to mock data
        setItems(MOCK_HISTORY);
        setActiveItemId(MOCK_HISTORY[0]?.id || null);
      }
    } else {
      // Use mock data on first load
      setItems(MOCK_HISTORY);
      setActiveItemId(MOCK_HISTORY[0]?.id || null);
    }
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  // Process audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording && !isProcessing) {
      handleProcessAudio(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, isRecording]);

  const handleProcessAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const newItem = await processVoiceRecording(blob);
      setItems((prev) => [newItem, ...prev]);
      setActiveItemId(newItem.id);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewRecording = async () => {
    if (isRecording) {
      stop();
    } else {
      setError(null);
      await start();
    }
  };

  const handleToggleTodo = (itemId: string, todoIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !item.data.todos) return item;

        const newTodos = [...item.data.todos];
        newTodos[todoIndex] = {
          ...newTodos[todoIndex],
          done: !newTodos[todoIndex].done,
        };

        return {
          ...item,
          data: {
            ...item.data,
            todos: newTodos,
          },
        };
      })
    );
  };

  const handleDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    // If deleted item was active, select the first available item
    if (activeItemId === itemId) {
      const remainingItems = items.filter((item) => item.id !== itemId);
      setActiveItemId(remainingItems.length > 0 ? remainingItems[0].id : null);
    }
  };

  const activeItem = items.find((item) => item.id === activeItemId);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNew: () => {
      if (!isRecording && !isProcessing) {
        handleNewRecording();
      }
    },
    onDelete: () => {
      if (activeItemId && !isRecording) {
        handleDelete(activeItemId);
      }
    },
    onEscape: () => {
      if (isRecording) {
        stop();
      }
    },
    onHelp: () => {
      setShowHelp(true);
    },
    onSettings: () => {
      setShowSettings(true);
    },
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        items={items}
        activeItemId={activeItemId}
        onSelectItem={setActiveItemId}
        onNewRecording={handleNewRecording}
        isRecording={isRecording}
      />

      <div className="flex-1 flex flex-col">
        {/* Status Bar */}
        {(isProcessing || isRecording || error || recorderError) && (
          <div className="border-b px-8 py-3 bg-muted/50">
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">Recording in progress...</span>
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Processing audio...</span>
              </div>
            )}
            {(error || recorderError) && (
              <div className="text-sm text-destructive font-medium">
                Error: {error || recorderError}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        {activeItem ? (
          <DetailView
            item={activeItem}
            onToggleTodo={handleToggleTodo}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">No item selected</p>
              <p className="text-sm">Select an item from the sidebar or create a new recording</p>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
