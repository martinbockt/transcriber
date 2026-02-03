import type { VoiceItem } from '@/types/voice-item';
import { logError } from '@/lib/error-sanitizer';

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
    item.keyFacts.forEach((fact) => {
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
      item.data.todos.forEach((todo) => {
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
    lines.push('_Note: Audio file has been downloaded separately._');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`_Exported on ${new Date().toLocaleString()}_`);

  return lines.join('\n');
}

/**
 * Formats a VoiceItem to JSON with optional audio data
 * @param item The voice item to format
 * @param includeAudio Whether to include audio as base64 data URL
 * @returns Formatted JSON string
 */
export function formatToJSON(item: VoiceItem, includeAudio: boolean = false): string {
  // Create a clean copy of the item
  const exportData: Partial<VoiceItem> = {
    id: item.id,
    createdAt: item.createdAt,
    originalTranscript: item.originalTranscript,
    title: item.title,
    tags: item.tags,
    summary: item.summary,
    keyFacts: item.keyFacts,
    intent: item.intent,
    data: item.data,
  };

  // Conditionally include audio data
  if (includeAudio && item.audioData) {
    exportData.audioData = item.audioData;
  }

  // Return formatted JSON with 2-space indentation
  return JSON.stringify(exportData, null, 2);
}

/**
 * Downloads a string as a file in the browser
 * @param content The content to download
 * @param filename The name of the file to download
 * @param mimeType The MIME type of the file (default: text/plain)
 */
export function downloadAsFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain',
): void {
  try {
    // Create a Blob from the content
    const blob = new Blob([content], { type: mimeType });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logError('Download error', error);
    throw error;
  }
}

/**
 * Downloads audio data as a separate audio file
 * @param audioData Base64-encoded audio data URL
 * @param filename The name of the audio file to download
 */
export function downloadAudioFile(audioData: string, filename: string): void {
  try {
    // Extract the base64 data and MIME type from the data URL
    const matches = audioData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid audio data format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob from binary data
    const blob = new Blob([bytes], { type: mimeType });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logError('Audio download error', error);
    throw error;
  }
}
