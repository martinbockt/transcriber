import type { VoiceItem, IntentType } from '@/types/voice-item';
import type { DateRange } from '@/components/SearchBar';

interface SearchResult {
  item: VoiceItem;
  score: number;
}

/**
 * Pre-processed search terms for optimized matching
 * Created once per search, not per-item, for better performance with 1000+ items
 */
interface ProcessedQuery {
  terms: string[];
  exactMatchRegexes: RegExp[];
}

/**
 * Searches voice items across multiple fields with relevance scoring
 * Optimized for performance with 1000+ items (target: <100ms)
 * @param items - Array of voice items to search
 * @param query - Search query string
 * @param selectedIntents - Filter by specific intent types
 * @param dateRange - Filter by date range
 * @returns Filtered and sorted array of voice items
 */
export function searchVoiceItems(
  items: VoiceItem[],
  query: string,
  selectedIntents: IntentType[],
  dateRange: DateRange,
): VoiceItem[] {
  // Apply filters first for performance (O(n) with early termination)
  // Create a shallow copy to prevent in-place mutation of the input array
  let filtered = [...items];

  // Filter by intent type
  if (selectedIntents.length > 0) {
    filtered = filtered.filter((item) => selectedIntents.includes(item.intent));
  }

  // Filter by date range (compute threshold once, then O(n) filter)
  if (dateRange !== 'all') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let dateThreshold: Date;

    switch (dateRange) {
      case 'today':
        dateThreshold = startOfDay;
        break;
      case 'week':
        dateThreshold = new Date(startOfDay);
        dateThreshold.setDate(dateThreshold.getDate() - 7);
        break;
      case 'month':
        dateThreshold = new Date(startOfDay);
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
        break;
      default:
        dateThreshold = new Date(0);
    }

    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= dateThreshold;
    });
  }

  // If no search query, return filtered items sorted by date (newest first)
  if (!query.trim()) {
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // PERFORMANCE OPTIMIZATION: Pre-process query once (not per-item)
  // This avoids creating thousands of RegExp objects in the tight loop
  const processedQuery = preprocessQuery(query);

  // Perform full-text search with relevance scoring
  const searchResults: SearchResult[] = filtered
    .map((item) => ({
      item,
      score: calculateRelevanceScore(item, processedQuery),
    }))
    .filter((result) => result.score > 0);

  // Sort by relevance score (highest first), then by date
  searchResults.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
  });

  return searchResults.map((result) => result.item);
}

/**
 * Pre-processes the search query for optimized matching
 * PERFORMANCE: This is called once per search, not once per item
 * With 1000 items, this saves ~10,000 regex compilations
 */
function preprocessQuery(query: string): ProcessedQuery {
  const normalizedQuery = query.toLowerCase().trim();
  const terms = normalizedQuery.split(/\s+/);

  // Pre-compile regex patterns for exact word matching
  // Escape special characters once, not repeatedly
  const exactMatchRegexes = terms.map((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, 'g'));

  return {
    terms,
    exactMatchRegexes,
  };
}

/**
 * Calculates relevance score for a voice item based on pre-processed search query
 * Higher scores indicate better matches
 * PERFORMANCE: Uses pre-compiled regexes to avoid thousands of RegExp creations
 */
function calculateRelevanceScore(item: VoiceItem, processedQuery: ProcessedQuery): number {
  let score = 0;

  // Weight factors for different fields (higher = more important)
  const WEIGHTS = {
    title: 10,
    tags: 8,
    summary: 5,
    keyFacts: 6,
    transcript: 3,
    todos: 4,
    researchAnswer: 5,
    draftContent: 4,
  };

  // Search in title (highest priority)
  score += countMatches(item.title, processedQuery) * WEIGHTS.title;

  // Search in tags
  item.tags.forEach((tag) => {
    score += countMatches(tag, processedQuery) * WEIGHTS.tags;
  });

  // Search in summary
  score += countMatches(item.summary, processedQuery) * WEIGHTS.summary;

  // Search in key facts
  item.keyFacts.forEach((fact) => {
    score += countMatches(fact, processedQuery) * WEIGHTS.keyFacts;
  });

  // Search in original transcript
  score += countMatches(item.originalTranscript, processedQuery) * WEIGHTS.transcript;

  // Search in dynamic data fields
  if (item.data.todos) {
    item.data.todos.forEach((todo) => {
      score += countMatches(todo.task, processedQuery) * WEIGHTS.todos;
    });
  }

  if (item.data.researchAnswer) {
    score += countMatches(item.data.researchAnswer, processedQuery) * WEIGHTS.researchAnswer;
  }

  if (item.data.draftContent) {
    score += countMatches(item.data.draftContent, processedQuery) * WEIGHTS.draftContent;
  }

  return score;
}

/**
 * Counts how many query terms match in the given text
 * Returns a weighted score based on exact matches and partial matches
 * PERFORMANCE: Uses pre-compiled regexes instead of creating new ones
 */
function countMatches(text: string, processedQuery: ProcessedQuery): number {
  if (!text) return 0;

  // Normalize text once
  const normalizedText = text.toLowerCase();
  let matches = 0;

  // Use pre-compiled regexes for exact matches
  for (let i = 0; i < processedQuery.terms.length; i++) {
    const term = processedQuery.terms[i];
    const regex = processedQuery.exactMatchRegexes[i];

    // Reset regex lastIndex for reuse (important for 'g' flag)
    regex.lastIndex = 0;

    // Exact word match (highest score) - use pre-compiled regex
    const exactMatches = (normalizedText.match(regex) || []).length;
    matches += exactMatches * 2;

    // Partial match (lower score) - use fast indexOf check
    if (exactMatches === 0 && normalizedText.includes(term)) {
      matches += 1;
    }
  }

  return matches;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
