/**
 * Test script for export functionality
 * Run with: npx tsx test-export.ts
 */

import { formatToMarkdown, formatToJSON } from './lib/export';
import type { VoiceItem } from './types/voice-item';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Mock VoiceItem data for testing
const mockItem1: VoiceItem = {
  id: 'test-1',
  createdAt: '2026-02-02T10:00:00Z',
  originalTranscript: 'This is a test transcript for the first item.',
  title: 'Test Voice Item 1',
  tags: ['test', 'export'],
  summary: 'This is a test summary for item 1.',
  keyFacts: ['Fact 1', 'Fact 2', 'Fact 3'],
  intent: 'note',
  data: {},
  audioData: 'data:audio/webm;base64,SGVsbG8gV29ybGQ=', // Mock base64 audio data
};

const mockItem2: VoiceItem = {
  id: 'test-2',
  createdAt: '2026-02-02T11:00:00Z',
  originalTranscript: 'This is a test transcript for the second item with tasks.',
  title: 'Test Voice Item 2 - Tasks',
  tags: ['test', 'todo'],
  summary: 'This is a test summary for item 2 with todos.',
  keyFacts: ['Task fact 1', 'Task fact 2'],
  intent: 'todo',
  data: {
    todos: [
      { task: 'Complete export feature', done: true },
      { task: 'Test all formats', done: false, due: '2026-02-03' },
    ],
  },
  audioData: 'data:audio/webm;base64,VGVzdEF1ZGlvRGF0YQ==',
};

const mockItem3: VoiceItem = {
  id: 'test-3',
  createdAt: '2026-02-02T12:00:00Z',
  originalTranscript: 'Research question about export formats.',
  title: 'Test Voice Item 3 - Research',
  tags: ['test', 'research'],
  summary: 'Research about different export formats.',
  keyFacts: ['Export formats include Markdown and JSON'],
  intent: 'research',
  data: {
    researchAnswer: 'Markdown is great for human readability, JSON is better for machine processing.',
  },
  audioData: 'data:audio/webm;base64,UmVzZWFyY2hBdWRpbw==',
};

console.log('🧪 Testing Export Functionality\n');
console.log('='.repeat(60));

// Test 1: Export single item as Markdown with audio
console.log('\n✅ Test 1: Export single item as Markdown WITH audio');
console.log('-'.repeat(60));
const markdown1 = formatToMarkdown(mockItem1, true);
console.log('Generated Markdown length:', markdown1.length);
console.log('Contains title:', markdown1.includes('# Test Voice Item 1'));
console.log('Contains metadata:', markdown1.includes('## Metadata'));
console.log('Contains audio:', markdown1.includes('## Audio'));
console.log('Audio data URL present:', markdown1.includes('data:audio/webm'));
writeFileSync(join(__dirname, 'test-output-markdown-with-audio.md'), markdown1);
console.log('✓ Saved to: test-output-markdown-with-audio.md');

// Test 2: Export single item as Markdown without audio
console.log('\n✅ Test 2: Export single item as Markdown WITHOUT audio');
console.log('-'.repeat(60));
const markdown2 = formatToMarkdown(mockItem1, false);
console.log('Generated Markdown length:', markdown2.length);
console.log('Contains title:', markdown2.includes('# Test Voice Item 1'));
console.log('Contains metadata:', markdown2.includes('## Metadata'));
console.log('Audio section excluded:', !markdown2.includes('## Audio'));
console.log('Audio data URL excluded:', !markdown2.includes('data:audio/webm'));
writeFileSync(join(__dirname, 'test-output-markdown-no-audio.md'), markdown2);
console.log('✓ Saved to: test-output-markdown-no-audio.md');

// Test 3: Export single item as JSON with audio
console.log('\n✅ Test 3: Export single item as JSON WITH audio');
console.log('-'.repeat(60));
const json1 = formatToJSON(mockItem1, true);
const parsed1 = JSON.parse(json1);
console.log('Valid JSON:', true);
console.log('Contains id:', parsed1.id === 'test-1');
console.log('Contains title:', parsed1.title === 'Test Voice Item 1');
console.log('Contains audioData:', !!parsed1.audioData);
console.log('audioData value present:', parsed1.audioData === mockItem1.audioData);
writeFileSync(join(__dirname, 'test-output-json-with-audio.json'), json1);
console.log('✓ Saved to: test-output-json-with-audio.json');

// Test 4: Export single item as JSON WITHOUT audio
console.log('\n✅ Test 4: Export single item as JSON WITHOUT audio');
console.log('-'.repeat(60));
const json2 = formatToJSON(mockItem1, false);
const parsed2 = JSON.parse(json2);
console.log('Valid JSON:', true);
console.log('Contains id:', parsed2.id === 'test-1');
console.log('Contains title:', parsed2.title === 'Test Voice Item 1');
console.log('audioData excluded:', !parsed2.audioData);
console.log('audioData is undefined:', parsed2.audioData === undefined);
writeFileSync(join(__dirname, 'test-output-json-no-audio.json'), json2);
console.log('✓ Saved to: test-output-json-no-audio.json');

// Test 5: Export item with todos (Markdown)
console.log('\n✅ Test 5: Export item with todos as Markdown');
console.log('-'.repeat(60));
const markdownTodos = formatToMarkdown(mockItem2, false);
console.log('Contains Tasks section:', markdownTodos.includes('## Tasks'));
console.log('Contains completed task:', markdownTodos.includes('[x] Complete export feature'));
console.log('Contains pending task:', markdownTodos.includes('[ ] Test all formats'));
console.log('Contains due date:', markdownTodos.includes('(Due: 2026-02-03)'));
writeFileSync(join(__dirname, 'test-output-todos.md'), markdownTodos);
console.log('✓ Saved to: test-output-todos.md');

// Test 6: Export item with research answer (Markdown)
console.log('\n✅ Test 6: Export item with research answer as Markdown');
console.log('-'.repeat(60));
const markdownResearch = formatToMarkdown(mockItem3, false);
console.log('Contains Research Answer section:', markdownResearch.includes('## Research Answer'));
console.log('Contains answer text:', markdownResearch.includes('Markdown is great for human readability'));
writeFileSync(join(__dirname, 'test-output-research.md'), markdownResearch);
console.log('✓ Saved to: test-output-research.md');

// Test 7: Export multiple items as JSON array
console.log('\n✅ Test 7: Export multiple items as JSON array');
console.log('-'.repeat(60));
const allItems = [mockItem1, mockItem2, mockItem3];
const jsonArray = JSON.stringify(
  allItems.map(item => JSON.parse(formatToJSON(item, false))),
  null,
  2
);
const parsedArray = JSON.parse(jsonArray);
console.log('Valid JSON array:', Array.isArray(parsedArray));
console.log('Contains 3 items:', parsedArray.length === 3);
console.log('First item correct:', parsedArray[0].id === 'test-1');
console.log('Second item correct:', parsedArray[1].id === 'test-2');
console.log('Third item correct:', parsedArray[2].id === 'test-3');
console.log('No audio data in any item:', parsedArray.every((item: any) => !item.audioData));
writeFileSync(join(__dirname, 'test-output-all-items.json'), jsonArray);
console.log('✓ Saved to: test-output-all-items.json');

// Test 8: Export multiple items as combined Markdown
console.log('\n✅ Test 8: Export multiple items as combined Markdown');
console.log('-'.repeat(60));
const combinedMarkdown = allItems
  .map(item => formatToMarkdown(item, false))
  .join('\n\n---\n\n');
console.log('Combined Markdown length:', combinedMarkdown.length);
console.log('Contains all titles:',
  combinedMarkdown.includes('# Test Voice Item 1') &&
  combinedMarkdown.includes('# Test Voice Item 2') &&
  combinedMarkdown.includes('# Test Voice Item 3')
);
console.log('Contains separators:', (combinedMarkdown.match(/---/g) || []).length >= 2);
writeFileSync(join(__dirname, 'test-output-all-items.md'), combinedMarkdown);
console.log('✓ Saved to: test-output-all-items.md');

console.log('\n' + '='.repeat(60));
console.log('🎉 All export tests completed successfully!');
console.log('='.repeat(60));
console.log('\nGenerated test files:');
console.log('  - test-output-markdown-with-audio.md');
console.log('  - test-output-markdown-no-audio.md');
console.log('  - test-output-json-with-audio.json');
console.log('  - test-output-json-no-audio.json');
console.log('  - test-output-todos.md');
console.log('  - test-output-research.md');
console.log('  - test-output-all-items.json');
console.log('  - test-output-all-items.md');
console.log('\n📖 Please review the Markdown files to verify they are readable!');
