import type { VoiceItem, IntentType } from '@/types/voice-item';
import type { DateRange } from '@/components/SearchBar';

interface SearchResult {
  item: VoiceItem;
  score: number;
}

/**
 * Searches voice items across multiple fields with relevance scoring
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
  dateRange: DateRange
): VoiceItem[] {
  // Apply filters first for performance
  let filtered = items;

  // Filter by intent type
  if (selectedIntents.length > 0) {
    filtered = filtered.filter((item) => selectedIntents.includes(item.intent));
  }

  // Filter by date range
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
    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Perform full-text search with relevance scoring
  const searchResults: SearchResult[] = filtered
    .map((item) => ({
      item,
      score: calculateRelevanceScore(item, query),
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
 * Calculates relevance score for a voice item based on search query
 * Higher scores indicate better matches
 */
function calculateRelevanceScore(item: VoiceItem, query: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/);

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
  score += countMatches(item.title, queryTerms) * WEIGHTS.title;

  // Search in tags
  item.tags.forEach((tag) => {
    score += countMatches(tag, queryTerms) * WEIGHTS.tags;
  });

  // Search in summary
  score += countMatches(item.summary, queryTerms) * WEIGHTS.summary;

  // Search in key facts
  item.keyFacts.forEach((fact) => {
    score += countMatches(fact, queryTerms) * WEIGHTS.keyFacts;
  });

  // Search in original transcript
  score += countMatches(item.originalTranscript, queryTerms) * WEIGHTS.transcript;

  // Search in dynamic data fields
  if (item.data.todos) {
    item.data.todos.forEach((todo) => {
      score += countMatches(todo.task, queryTerms) * WEIGHTS.todos;
    });
  }

  if (item.data.researchAnswer) {
    score += countMatches(item.data.researchAnswer, queryTerms) * WEIGHTS.researchAnswer;
  }

  if (item.data.draftContent) {
    score += countMatches(item.data.draftContent, queryTerms) * WEIGHTS.draftContent;
  }

  return score;
}

/**
 * Counts how many query terms match in the given text
 * Returns a weighted score based on exact matches and partial matches
 */
function countMatches(text: string, queryTerms: string[]): number {
  if (!text) return 0;

  const normalizedText = text.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    // Exact word match (highest score)
    const exactMatches = (normalizedText.match(new RegExp(`\\b${escapeRegex(term)}\\b`, 'g')) || []).length;
    matches += exactMatches * 2;

    // Partial match (lower score)
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
