import { z } from 'zod';

/**
 * Allowed audio MIME types for processing
 */
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
] as const;

/**
 * Default maximum file size: 25MB in bytes
 */
export const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Validation configuration schema
 */
export const AudioValidationConfigSchema = z.object({
  maxFileSize: z.number().positive().default(DEFAULT_MAX_FILE_SIZE),
  allowedMimeTypes: z.array(z.string()).default([...ALLOWED_AUDIO_MIME_TYPES]),
  maxDuration: z.number().positive().optional(),
  minDuration: z.number().positive().optional(),
});

export type AudioValidationConfig = z.infer<typeof AudioValidationConfigSchema>;

/**
 * Validation result containing success status and optional error details
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    fileSize?: number;
    mimeType?: string;
    duration?: number;
  };
}

/**
 * Custom error class for audio validation failures
 */
export class AudioValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AudioValidationError';
  }
}

/**
 * Validates MIME type of audio blob
 * @param blob - Audio blob to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
function validateMimeType(blob: Blob, allowedTypes: string[]): boolean {
  if (!blob.type) {
    return false;
  }
  return allowedTypes.includes(blob.type);
}

/**
 * Validates file size of audio blob
 * @param blob - Audio blob to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns true if valid, false otherwise
 */
function validateFileSize(blob: Blob, maxSize: number): boolean {
  return blob.size > 0 && blob.size <= maxSize;
}

/**
 * Gets duration of audio blob by loading it into an Audio element
 * @param blob - Audio blob to analyze
 * @returns Promise resolving to duration in seconds
 */
async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      });

      audio.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Validates duration of audio blob
 * @param duration - Duration in seconds
 * @param minDuration - Minimum allowed duration (optional)
 * @param maxDuration - Maximum allowed duration (optional)
 * @returns true if valid, false otherwise
 */
function validateDuration(duration: number, minDuration?: number, maxDuration?: number): boolean {
  if (minDuration !== undefined && duration < minDuration) {
    return false;
  }
  if (maxDuration !== undefined && duration > maxDuration) {
    return false;
  }
  return true;
}

/**
 * Validates an audio blob against specified constraints
 * @param blob - Audio blob to validate
 * @param config - Validation configuration (optional)
 * @returns Promise resolving to validation result
 */
export async function validateAudioBlob(
  blob: Blob,
  config?: Partial<AudioValidationConfig>,
): Promise<ValidationResult> {
  try {
    // Parse and merge with default config
    const validationConfig = AudioValidationConfigSchema.parse(config || {});

    // Check if blob exists
    if (!blob) {
      return {
        valid: false,
        error: 'Audio blob is null or undefined',
      };
    }

    // Validate MIME type
    if (!validateMimeType(blob, validationConfig.allowedMimeTypes)) {
      return {
        valid: false,
        error: `Invalid audio format. Allowed types: ${validationConfig.allowedMimeTypes.join(', ')}`,
        details: {
          mimeType: blob.type || 'unknown',
          fileSize: blob.size,
        },
      };
    }

    // Validate file size
    if (!validateFileSize(blob, validationConfig.maxFileSize)) {
      const maxSizeMB = (validationConfig.maxFileSize / (1024 * 1024)).toFixed(2);
      const actualSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Audio file size (${actualSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
        details: {
          fileSize: blob.size,
          mimeType: blob.type,
        },
      };
    }

    // Validate duration if constraints are provided
    if (validationConfig.maxDuration !== undefined || validationConfig.minDuration !== undefined) {
      try {
        const duration = await getAudioDuration(blob);

        if (
          !validateDuration(duration, validationConfig.minDuration, validationConfig.maxDuration)
        ) {
          const constraints: string[] = [];
          if (validationConfig.minDuration !== undefined) {
            constraints.push(`minimum ${validationConfig.minDuration}s`);
          }
          if (validationConfig.maxDuration !== undefined) {
            constraints.push(`maximum ${validationConfig.maxDuration}s`);
          }
          return {
            valid: false,
            error: `Audio duration (${duration.toFixed(1)}s) does not meet constraints (${constraints.join(', ')})`,
            details: {
              duration,
              fileSize: blob.size,
              mimeType: blob.type,
            },
          };
        }

        // Include duration in successful validation
        return {
          valid: true,
          details: {
            duration,
            fileSize: blob.size,
            mimeType: blob.type,
          },
        };
      } catch (err) {
        return {
          valid: false,
          error: `Failed to validate audio duration: ${err instanceof Error ? err.message : 'Unknown error'}`,
          details: {
            fileSize: blob.size,
            mimeType: blob.type,
          },
        };
      }
    }

    // All validations passed
    return {
      valid: true,
      details: {
        fileSize: blob.size,
        mimeType: blob.type,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: `Validation error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validates an audio blob and throws an error if validation fails
 * This is a convenience function for cases where you want to use try/catch
 * @param blob - Audio blob to validate
 * @param config - Validation configuration (optional)
 * @throws AudioValidationError if validation fails
 */
export async function validateAudioBlobOrThrow(
  blob: Blob,
  config?: Partial<AudioValidationConfig>,
): Promise<void> {
  const result = await validateAudioBlob(blob, config);
  if (!result.valid) {
    throw new AudioValidationError(result.error || 'Audio validation failed', result.details);
  }
}

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "340 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1:23", "2:30:45")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
