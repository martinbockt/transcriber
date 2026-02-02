"use client";

import { useState, useMemo } from 'react';
import type { VoiceItem, IntentType } from '@/types/voice-item';
import type { DateRange } from '@/components/SearchBar';
import { searchVoiceItems } from '@/lib/search';

export interface UseSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedIntents: IntentType[];
  setSelectedIntents: (intents: IntentType[]) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  filteredItems: VoiceItem[];
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
}

export interface UseSearchOptions {
  items: VoiceItem[];
}

export function useSearch({ items }: UseSearchOptions): UseSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntents, setSelectedIntents] = useState<IntentType[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Compute filtered results using memoization for performance
  const filteredItems = useMemo(() => {
    return searchVoiceItems(items, searchQuery, selectedIntents, dateRange);
  }, [items, searchQuery, selectedIntents, dateRange]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || selectedIntents.length > 0 || dateRange !== 'all';
  }, [searchQuery, selectedIntents.length, dateRange]);

  // Clear all filters at once
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedIntents([]);
    setDateRange('all');
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedIntents,
    setSelectedIntents,
    dateRange,
    setDateRange,
    filteredItems,
    hasActiveFilters,
    clearAllFilters,
  };
}
