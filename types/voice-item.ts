export type IntentType = 'TODO' | 'RESEARCH' | 'DRAFT' | 'NOTE';

export interface VoiceItem {
  id: string; // UUID
  createdAt: string; // ISO String
  originalTranscript: string;
  audioData?: string; // Base64-encoded audio for playback (optional)

  // --- Standard Modules (Always present) ---
  title: string;       // Generated short title
  tags: string[];      // e.g. ["Project A", "Urgent"]
  summary: string;     // 2-3 sentence summary
  keyFacts: string[];  // Bullet points with hard facts (names, dates, money)

  // --- Dynamic Modules (Intent based) ---
  intent: IntentType;
  data: {
    todos?: Array<{ task: string; done: boolean; due?: string }>;
    researchAnswer?: string; // AI generated answer
    draftContent?: string;   // Polished text
  };
}
