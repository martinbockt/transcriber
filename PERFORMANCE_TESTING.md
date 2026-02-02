# Performance Testing Guide

## Overview
This guide helps verify the search performance meets the <100ms requirement with 1000+ items.

## Prerequisites
- Dev server running (`pnpm dev`)
- Chrome or Firefox with DevTools

## Test Setup

### 1. Generate Mock Data (1000+ items)

Add this temporary code to `app/page.tsx` in the `useEffect` for loading items:

```typescript
// TEMPORARY: For performance testing only
const generateMockItems = (count: number): VoiceItem[] => {
  const intents: IntentType[] = ['TODO', 'RESEARCH', 'DRAFT', 'NOTE'];
  const mockItems: VoiceItem[] = [];

  for (let i = 0; i < count; i++) {
    mockItems.push({
      id: `mock-${i}`,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      originalTranscript: `This is mock transcript number ${i} with various keywords like project meeting deadline budget report analysis`,
      title: `Mock Item ${i}`,
      tags: [`tag-${i % 10}`, `category-${i % 5}`],
      summary: `This is a summary for item ${i} containing searchable content`,
      keyFacts: [`Fact 1 for item ${i}`, `Fact 2 with data`],
      intent: intents[i % 4],
      data: {},
    });
  }

  return mockItems;
};

// Add 1000 mock items for testing
setItems([...MOCK_HISTORY, ...generateMockItems(1000)]);
```

### 2. Measure Search Performance

#### Using Chrome DevTools:

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record** (⚫)
4. In the app, type a search query (e.g., "project")
5. Stop recording
6. Find the search operation in the timeline
7. Measure time from keypress to UI update

#### Using Console Timing:

Add to `lib/search.ts` temporarily:

```typescript
export function searchVoiceItems(...) {
  console.time('search');
  // ... existing code ...
  const results = searchResults.map((result) => result.item);
  console.timeEnd('search');
  return results;
}
```

Type in search and check console for timing.

## Acceptance Criteria

✅ Search completes in <100ms with 1000 items
✅ Search completes in <50ms with 500 items
✅ UI remains responsive during search
✅ No visible lag or stuttering

## Expected Results

Based on optimizations:
- **1000 items**: <80ms (well under 100ms target)
- **500 items**: ~20-40ms
- **100 items**: ~5-10ms

## Troubleshooting

**If search is slow (>100ms)**:
1. Check regex compilation is outside loop (should be)
2. Verify early filtering happens before text search
3. Ensure useMemo dependencies are correct in page.tsx
4. Check browser isn't throttling (close other tabs)

**If UI stutters**:
1. Verify useMemo is used in page.tsx for filteredItems
2. Check React DevTools for unnecessary re-renders
3. Ensure search function doesn't mutate state

## Cleanup

After testing, remove mock data generation code.
