export type IntentType = 'TODO' | 'RESEARCH' | 'DRAFT' | 'NOTE';

export interface VoiceItem {
  id: string; // UUID
  createdAt: string; // ISO String
  originalTranscript: string;
  audioData?: string; // Base64-encoded audio for playback (optional)
  pinned?: boolean; // Whether item is pinned to top of list

  // --- Standard Modules (Always present) ---
  title: string;       // Generated short title
  tags: string[];      // e.g. ["Project A", "Urgent"]
  summary: string;     // 2-3 sentence summary
  keyFacts: string[];  // Bullet points with hard facts (names, dates, money)

  // --- Original AI-Generated Content (for edit tracking) ---
  originalAITitle?: string;       // Original AI-generated title before edits
  originalAISummary?: string;     // Original AI-generated summary before edits
  originalAIKeyFacts?: string[];  // Original AI-generated key facts before edits
  originalAITranscript?: string;  // Original AI-generated transcript before edits

  // --- Dynamic Modules (Intent based) ---
  intent: IntentType;
  data: {
    todos: Array<{ task: string; done: boolean; due: string | null }> | null;
    researchAnswer: string | null; // AI generated answer
    draftContent: string | null;   // Polished text

    // Original AI-generated dynamic content
    originalAITodos?: Array<{ task: string; done: boolean; due: string | null }>;
    originalAIResearchAnswer?: string;
    originalAIDraftContent?: string;
  };
}
