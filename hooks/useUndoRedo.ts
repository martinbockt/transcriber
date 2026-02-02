"use client";

import { useState, useCallback } from 'react';

export interface UndoRedoState<T> {
  present: T;
  past: T[];
  future: T[];
}

export interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newState: T) => void;
}

export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    present: initialState,
    past: [],
    future: [],
  });

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setHistory((currentHistory) => {
      const resolvedState =
        typeof newState === 'function'
          ? (newState as (prevState: T) => T)(currentHistory.present)
          : newState;

      // Don't add to history if state hasn't changed
      if (resolvedState === currentHistory.present) {
        return currentHistory;
      }

      return {
        present: resolvedState,
        past: [...currentHistory.past, currentHistory.present],
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.past.length === 0) {
        return currentHistory;
      }

      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, -1);

      return {
        present: previous,
        past: newPast,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.future.length === 0) {
        return currentHistory;
      }

      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);

      return {
        present: next,
        past: [...currentHistory.past, currentHistory.present],
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setHistory({
      present: newState,
      past: [],
      future: [],
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
  };
}
