"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DetailView } from "@/components/DetailView";
import { EmptyState } from "@/components/EmptyState";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { processVoiceRecording } from "@/lib/ai";
import { searchVoiceItems } from "@/lib/search";
import { MOCK_HISTORY } from "@/lib/mock-data";
import type { VoiceItem, IntentType } from "@/types/voice-item";
import type { DateRange } from "@/components/SearchBar";

const STORAGE_KEY = "voice-assistant-history";

export default function Home() {
  const [items, setItems] = useState<VoiceItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Undo/redo history management
  const history = useRef<VoiceItem[][]>([]);
  const historyIndex = useRef<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntents, setSelectedIntents] = useState<IntentType[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const {
    isRecording,
    audioBlob,
    countdown,
    elapsedTime,
    start,
    stop,
    error: recorderError,
  } = useAudioRecorder();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Push current state to history (for undo/redo)
  const pushToHistory = (newItems: VoiceItem[]) => {
    if (isUndoRedoAction.current) {
      // Don't add to history if this is an undo/redo action
      isUndoRedoAction.current = false;
      return;
    }

    // Remove any forward history if we're not at the end
    if (historyIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex.current + 1);
    }

    // Add new state to history
    history.current.push(JSON.parse(JSON.stringify(newItems)));
    historyIndex.current = history.current.length - 1;

    // Limit history to 50 states
    if (history.current.length > 50) {
      history.current.shift();
      historyIndex.current--;
    }
  };

  // Undo last change
  const handleUndo = () => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      isUndoRedoAction.current = true;
      setItems(
        JSON.parse(JSON.stringify(history.current[historyIndex.current])),
      );
    }
  };

  // Redo last undone change
  const handleRedo = () => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      isUndoRedoAction.current = true;
      setItems(
        JSON.parse(JSON.stringify(history.current[historyIndex.current])),
      );
    }
  };

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        // Initialize history with loaded state
        history.current = [JSON.parse(JSON.stringify(parsed))];
        historyIndex.current = 0;
        if (parsed.length > 0) {
          setActiveItemId(parsed[0].id);
        }
      } catch (err) {
        console.error("Failed to parse stored items:", err);
        // Fallback to mock data
        setItems(MOCK_HISTORY);
        history.current = [JSON.parse(JSON.stringify(MOCK_HISTORY))];
        historyIndex.current = 0;
        setActiveItemId(MOCK_HISTORY[0]?.id || null);
      }
    } else {
      // Use mock data on first load
      setItems(MOCK_HISTORY);
      history.current = [JSON.parse(JSON.stringify(MOCK_HISTORY))];
      historyIndex.current = 0;
      setActiveItemId(MOCK_HISTORY[0]?.id || null);
    }
  }, []);

  // Save items to localStorage with 500ms debounce
  useEffect(() => {
    if (items.length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [items]);

  // Track items changes for undo/redo history
  useEffect(() => {
    // Skip if items is empty (initial state) or if this is the initial load
    if (items.length === 0 || history.current.length === 0) {
      return;
    }

    // Skip if this was an undo/redo action
    if (isUndoRedoAction.current) {
      return;
    }

    // Check if items actually changed (deep comparison of current vs last history state)
    const lastHistoryState = history.current[historyIndex.current];
    if (JSON.stringify(items) !== JSON.stringify(lastHistoryState)) {
      pushToHistory(items);
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
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewRecording = async () => {
    if (isRecording || countdown !== null) {
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
      }),
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

  // Filter items based on search criteria
  const filteredItems = useMemo(() => {
    return searchVoiceItems(items, searchQuery, selectedIntents, dateRange);
  }, [items, searchQuery, selectedIntents, dateRange]);

  const handleExportAll = () => {
    setShowExportDialog(true);
  };

  const handleClearAllData = () => {
    // Clear all items and reset active item
    setItems([]);
    setActiveItemId(null);
  };
  // Note: localStorage is already cleared by SettingsDialog
  const handleUpdateTitle = (itemId: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        // Preserve original AI content on first edit
        const updates: Partial<VoiceItem> = { title: newTitle };
        if (!item.originalAITitle && item.title !== newTitle) {
          updates.originalAITitle = item.title;
        }

        return { ...item, ...updates };
      }),
    );
  };

  const handleUpdateSummary = (itemId: string, newSummary: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        // Preserve original AI content on first edit
        const updates: Partial<VoiceItem> = { summary: newSummary };
        if (!item.originalAISummary && item.summary !== newSummary) {
          updates.originalAISummary = item.summary;
        }

        return { ...item, ...updates };
      }),
    );
  };

  const handleUpdateTranscript = (itemId: string, newTranscript: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        // Preserve original AI transcript on first edit
        const updates: any = { originalTranscript: newTranscript };
        if (
          !item.originalAITranscript &&
          item.originalTranscript !== newTranscript
        ) {
          updates.originalAITranscript = item.originalTranscript;
        }

        return { ...item, ...updates };
      }),
    );
  };

  const activeItem = items.find((item) => item.id === activeItemId);

  // Clear search function
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedIntents([]);
    setDateRange("all");
    searchInputRef.current?.blur();
  };

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
      } else if (
        searchQuery ||
        selectedIntents.length > 0 ||
        dateRange !== "all"
      ) {
        clearSearch();
      }
    },
    onHelp: () => {
      setShowHelp(true);
    },
    onSearch: () => {
      searchInputRef.current?.focus();
    },
    onSettings: () => {
      setShowSettings(true);
    },
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        ref={searchInputRef}
        items={filteredItems}
        activeItemId={activeItemId}
        onSelectItem={setActiveItemId}
        onNewRecording={handleNewRecording}
        onExportAll={handleExportAll}
        isRecording={isRecording}
        countdown={countdown}
        elapsedTime={elapsedTime}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIntents={selectedIntents}
        onIntentsChange={setSelectedIntents}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col">
        {/* Status Bar */}
        {(isProcessing || isRecording || countdown !== null || error || recorderError) && (
          <div className="border-b px-8 py-3 bg-muted/50">
            {countdown !== null && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm font-medium">
                  Starting in {countdown}...
                </span>
              </div>
            )}
            {isRecording && countdown === null && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">
                  Recording: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
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
            onUpdateTitle={handleUpdateTitle}
            onUpdateSummary={handleUpdateSummary}
            onUpdateTranscript={handleUpdateTranscript}
          />
        ) : (
          <EmptyState onNewRecording={handleNewRecording} />
        )}
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog open={showHelp} onOpenChange={setShowHelp} />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        items={items}
      />
      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        onDataCleared={handleClearAllData}
      />
    </div>
  );
}
