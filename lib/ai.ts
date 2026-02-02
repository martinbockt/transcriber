import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { VoiceItem, IntentType } from '@/types/voice-item';

const STORAGE_KEY = 'openai_api_key';

async function getApiKey(): Promise<string> {
  // Check Tauri secure storage first (user-provided key)
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const storedKey = await invoke<string>('get_secure_value', { key: STORAGE_KEY });
      if (storedKey) {
        return storedKey;
      }
    } catch (error) {
      console.error('Failed to retrieve API key from secure storage:', error);
      // Fall through to environment variable
    }
  }

  // Fall back to localStorage for web-only mode (development)
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey) {
      return storedKey;
    }
  }

  // Fall back to environment variable
  const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (envKey) {
    return envKey;
  }

  throw new Error('OpenAI API key is not configured. Please add your API key in Settings.');
}

const VoiceItemSchema = z.object({
  title: z.string().describe('A short, descriptive title (max 60 characters)'),
  tags: z.array(z.string()).describe('2-5 relevant tags for categorization'),
  summary: z.string().describe('A 2-3 sentence summary of the content'),
  keyFacts: z.array(z.string()).describe('Bullet points with hard facts like names, dates, amounts'),
  intent: z.enum(['TODO', 'RESEARCH', 'DRAFT', 'NOTE']).describe('The primary intent of the voice input'),
  data: z.object({
    todos: z.array(z.object({
      task: z.string(),
      done: z.boolean().default(false),
      due: z.string().optional(),
    })).optional().describe('List of action items if intent is TODO'),
    researchAnswer: z.string().optional().describe('AI-generated answer if intent is RESEARCH'),
    draftContent: z.string().optional().describe('Polished, ready-to-use text if intent is DRAFT'),
  }),
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = await getApiKey();

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Transcription failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

export async function processContent(transcript: string): Promise<Omit<VoiceItem, 'id' | 'createdAt' | 'originalTranscript'>> {
  const apiKey = await getApiKey();

  try {
    const openai = createOpenAI({ apiKey });
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: VoiceItemSchema,
      prompt: `Analyze the following voice transcript and extract structured information.

Transcript: "${transcript}"

Instructions:
1. Determine the PRIMARY intent:
   - TODO: Contains action items or tasks to be done
   - RESEARCH: Contains a question or request for information/analysis
   - DRAFT: Request to write or compose something (email, message, document)
   - NOTE: General information, observations, or thoughts to remember

2. Extract:
   - A clear, concise title
   - 2-5 relevant tags for categorization
   - A 2-3 sentence summary
   - Key facts (names, dates, amounts, specific details)

3. Based on intent, populate the data field:
   - TODO: Extract all action items with clear task descriptions
   - RESEARCH: Provide a comprehensive, well-researched answer to the question
   - DRAFT: Write polished, ready-to-use content based on the request
   - NOTE: Leave data fields empty (just store the structured info)

Be thorough and accurate. Ensure the output is immediately useful to the user.`,
    });

    return result.object;
  } catch (error) {
    console.error('Processing error:', error);
    throw error;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function processVoiceRecording(audioBlob: Blob): Promise<VoiceItem> {
  // Validate audio blob before making API calls
  if (!audioBlob) {
    throw new Error('Invalid audio: No audio blob provided');
  }

  if (audioBlob.size === 0) {
    throw new Error('Invalid audio: Audio blob is empty');
  }

  if (!audioBlob.type.startsWith('audio/')) {
    throw new Error('Invalid audio: Blob must be an audio file');
  }

  const transcript = await transcribeAudio(audioBlob);
  const processed = await processContent(transcript);

  // Convert audio blob to base64 for storage
  const audioData = await blobToBase64(audioBlob);

  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    originalTranscript: transcript,
    audioData,
    ...processed,
  };
}
