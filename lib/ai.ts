import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { VoiceItem, IntentType } from '@/types/voice-item';
import { createRateLimiter } from '@/lib/rate-limiter';

const STORAGE_KEY = 'openai_api_key';

/**
 * Sanitizes an error object to remove sensitive information like API keys
 * before logging to console
 */
function sanitizeError(error: unknown): string {
  if (!error) {
    return 'Unknown error';
  }

  // Convert error to string representation
  let errorStr = '';
  if (error instanceof Error) {
    errorStr = `${error.name}: ${error.message}`;
    if (error.stack) {
      errorStr += `\n${error.stack}`;
    }
  } else if (typeof error === 'string') {
    errorStr = error;
  } else {
    try {
      errorStr = JSON.stringify(error);
    } catch {
      errorStr = String(error);
    }
  }

  // Remove API keys (various formats)
  errorStr = errorStr.replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_API_KEY]');
  errorStr = errorStr.replace(/Bearer\s+sk-[a-zA-Z0-9]{32,}/gi, 'Bearer [REDACTED_API_KEY]');

  // Remove authorization headers
  errorStr = errorStr.replace(/authorization['":\s]+[^,}\s]+/gi, 'authorization: [REDACTED]');
  errorStr = errorStr.replace(/"Authorization":\s*"[^"]+"/gi, '"Authorization": "[REDACTED]"');

  // Remove any other potential keys (env vars, tokens, etc.)
  errorStr = errorStr.replace(/api[_-]?key['":\s]*[a-zA-Z0-9_-]{16,}/gi, 'api_key: [REDACTED]');
  errorStr = errorStr.replace(/token['":\s]*[a-zA-Z0-9_-]{16,}/gi, 'token: [REDACTED]');

  return errorStr;
}

/**
 * Logs an error to console with sensitive information removed
 */
function logSanitizedError(message: string, error: unknown): void {
  const sanitized = sanitizeError(error);
  console.log(`[ERROR] ${message}`, sanitized);
}

/**
 * Custom error class for rate limiting errors
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfterMs: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Retry configuration for exponential backoff
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Default function to determine if an error should trigger a retry
 */
function shouldRetryDefault(error: unknown): boolean {
  // Don't retry rate limit errors (they have their own retry mechanism)
  if (error instanceof RateLimitError) {
    return false;
  }

  // Don't retry validation errors (won't succeed on retry)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('invalid audio') ||
      message.includes('validation') ||
      message.includes('schema')
    ) {
      return false;
    }
  }

  // Retry on network errors, timeouts, and temporary API failures
  return true;
}

/**
 * Executes a function with exponential backoff retry logic
 * @param fn The async function to execute
 * @param config Retry configuration
 * @returns The result of the function
 * @throws The last error if all attempts fail
 */
async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs, shouldRetry = shouldRetryDefault } = config;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

      logSanitizedError(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms:`,
        error,
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Rate limiter for Whisper API (transcription)
 * Configured for 3 requests per minute with burst capacity of 5
 */
const whisperRateLimiter = createRateLimiter(3, 5);

/**
 * Rate limiter for GPT-4o API (content processing)
 * Configured for 3 requests per minute with burst capacity of 5
 */
const gptRateLimiter = createRateLimiter(3, 5);

export async function getApiKey(): Promise<string> {
  // Check Tauri secure storage first (user-provided key)
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const storedKey = await invoke<string>('get_secure_value', {
        key: STORAGE_KEY,
      });
      if (storedKey) {
        return storedKey;
      }
    } catch (error) {
      logSanitizedError('Failed to retrieve API key from secure storage:', error);
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
  keyFacts: z
    .array(z.string())
    .describe('Bullet points with hard facts like names, dates, amounts'),
  intent: z
    .enum(['TODO', 'RESEARCH', 'DRAFT', 'NOTE'])
    .describe('The primary intent of the voice input'),
  data: z.object({
    todos: z
      .array(
        z.object({
          task: z.string(),
          done: z.boolean(),
          due: z.string().nullable(),
        }),
      )
      .nullable()
      .describe('List of action items if intent is TODO'),
    researchAnswer: z.string().nullable().describe('AI-generated answer if intent is RESEARCH'),
    draftContent: z.string().nullable().describe('Polished, ready-to-use text if intent is DRAFT'),
  }),
});

export async function transcribeAudio(
  audioBlob: Blob,
): Promise<{ text: string; language: string }> {
  // Check rate limit before making API call
  if (!whisperRateLimiter.acquire()) {
    const retryAfterMs = whisperRateLimiter.getTimeUntilTokensAvailable(1);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    throw new RateLimitError(
      `Rate limit exceeded for transcription. Please wait ${retryAfterSeconds} second${retryAfterSeconds !== 1 ? 's' : ''} and try again.`,
      retryAfterMs,
      'whisper',
    );
  }

  const apiKey = await getApiKey();

  return withRetry(
    async () => {
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Transcription failed: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return { text: data.text, language: data.language };
      } catch (error) {
        logSanitizedError('Transcription error:', error);
        throw error;
      }
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 8000,
    },
  );
}

export async function processContent(
  transcript: string,
  language?: string,
): Promise<Omit<VoiceItem, 'id' | 'createdAt' | 'originalTranscript'>> {
  // Check rate limit before making API call
  if (!gptRateLimiter.acquire()) {
    const retryAfterMs = gptRateLimiter.getTimeUntilTokensAvailable(1);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    throw new RateLimitError(
      `Rate limit exceeded for content processing. Please wait ${retryAfterSeconds} second${retryAfterSeconds !== 1 ? 's' : ''} and try again.`,
      retryAfterMs,
      'gpt-4o',
    );
  }

  const apiKey = await getApiKey();

  return withRetry(
    async () => {
      try {
        const openai = createOpenAI({ apiKey });
        const result = await generateObject({
          model: openai('gpt-4o'),
          schema: VoiceItemSchema,
          prompt: `Analyze the following voice transcript and extract structured information.

Transcript: "${transcript}"
${language ? `Detected Language Code: "${language}"` : ''}

Instructions:
1. Identify the language of the transcript${language ? ` (likely '${language}' based on initial detection)` : ''} and ensure ALL generated output is in this language. This applies to the title, summary, key facts, todos, research answers, and draft content. Do NOT translate to English unless the transcript is in English.

2. Determine the PRIMARY intent:
   - TODO: Contains action items or tasks to be done
   - RESEARCH: Contains a question or request for information/analysis
   - DRAFT: Request to write or compose something (email, message, document)
   - NOTE: General information, observations, or thoughts to remember

3. Extract (IN THE TRANSCRIPT'S LANGUAGE):
   - A clear, concise title
   - 2-5 relevant tags for categorization
   - A 2-3 sentence summary
   - Key facts (names, dates, amounts, specific details)

4. Based on intent, populate the data field (use null for fields not relevant to the intent):
   - TODO: Extract all action items with clear task descriptions (set done: false for all new tasks, use null for due if no date mentioned). Set researchAnswer and draftContent to null.
   - RESEARCH: Provide a comprehensive, well-researched answer to the question. Set todos and draftContent to null.
   - DRAFT: Write polished, ready-to-use content based on the request. Set todos and researchAnswer to null.
   - NOTE: Set all data fields (todos, researchAnswer, draftContent) to null.

IMPORTANT: Strictly output in the same language as the transcript. Do not translate.
Be thorough and accurate. Ensure the output is immediately useful to the user.`,
        });

        return result.object;
      } catch (error) {
        logSanitizedError('Processing error:', error);
        throw error;
      }
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 8000,
    },
  );
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

  const { text: transcript, language } = await transcribeAudio(audioBlob);
  const processed = await processContent(transcript, language);

  // Convert audio blob to base64 for storage
  const audioData = await blobToBase64(audioBlob);

  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    originalTranscript: transcript,
    audioData,
    language,
    ...processed,
  };
}

export async function processRealtimeRecording(
  audioBlob: Blob,
  transcript: string,
  language?: string,
): Promise<VoiceItem> {
  const processed = await processContent(transcript, language);
  const audioData = await blobToBase64(audioBlob);

  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    originalTranscript: transcript,
    audioData,
    language: language || 'en',
    ...processed,
  };
}
