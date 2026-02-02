import type { VoiceItem } from '@/types/voice-item';

/**
 * Formats a VoiceItem to Markdown with all metadata and content
 * @param item The voice item to format
 * @param includeAudio Whether to include audio as base64 data URL
 * @returns Formatted Markdown string
 */
export function formatToMarkdown(item: VoiceItem, includeAudio: boolean = false): string {
  const lines: string[] = [];

  // Title as main heading
  lines.push(`# ${item.title}`);
  lines.push('');

  // Metadata section
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- **Created:** ${new Date(item.createdAt).toLocaleString()}`);
  lines.push(`- **Intent:** ${item.intent}`);
  lines.push(`- **Tags:** ${item.tags.join(', ')}`);
  lines.push('');

  // Summary section
  lines.push('## Summary');
  lines.push('');
  lines.push(item.summary);
  lines.push('');

  // Key Facts section (if any)
  if (item.keyFacts && item.keyFacts.length > 0) {
    lines.push('## Key Facts');
    lines.push('');
    item.keyFacts.forEach(fact => {
      lines.push(`- ${fact}`);
    });
    lines.push('');
  }

  // Intent-specific data sections
  if (item.data) {
    // TODOs
    if (item.data.todos && item.data.todos.length > 0) {
      lines.push('## Tasks');
      lines.push('');
      item.data.todos.forEach(todo => {
        const checkbox = todo.done ? '[x]' : '[ ]';
        const dueDate = todo.due ? ` (Due: ${todo.due})` : '';
        lines.push(`- ${checkbox} ${todo.task}${dueDate}`);
      });
      lines.push('');
    }

    // Research Answer
    if (item.data.researchAnswer) {
      lines.push('## Research Answer');
      lines.push('');
      lines.push(item.data.researchAnswer);
      lines.push('');
    }

    // Draft Content
    if (item.data.draftContent) {
      lines.push('## Draft Content');
      lines.push('');
      lines.push(item.data.draftContent);
      lines.push('');
    }
  }

  // Original Transcript section
  lines.push('## Original Transcript');
  lines.push('');
  lines.push(item.originalTranscript);
  lines.push('');

  // Audio section (if included)
  if (includeAudio && item.audioData) {
    lines.push('## Audio');
    lines.push('');
    lines.push(`[Audio Recording](${item.audioData})`);
    lines.push('');
    lines.push('_Note: Audio is embedded as a base64 data URL. Some markdown viewers may not support audio playback._');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`_Exported on ${new Date().toLocaleString()}_`);

  return lines.join('\n');
}
