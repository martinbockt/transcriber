/**
 * Error sanitization utility to prevent leaking sensitive data in error messages
 * Detects and redacts: API keys, Bearer tokens, email addresses, file paths
 */

/**
 * Determines if the current environment is production
 * @returns true if in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Patterns for detecting sensitive data
 */
const SENSITIVE_PATTERNS = {
  // OpenAI API keys (sk-proj-... or sk-...)
  openaiKey: /sk-[a-zA-Z0-9]{20,}/g,
  // Bearer tokens
  bearerToken: /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // File paths (Unix and Windows)
  filePath: /(?:\/[a-zA-Z0-9._-]+)+|(?:[A-Z]:\\(?:[a-zA-Z0-9._-]+\\)+[a-zA-Z0-9._-]*)/g,
  // Generic API key patterns (multiple formats)
  genericApiKey: /(?:api[_-]?key|apikey|api[_-]?secret)["\s:=]+[a-zA-Z0-9_\-]{20,}/gi,
};

/**
 * Redaction replacements for different types of sensitive data
 */
const REDACTION_REPLACEMENTS = {
  openaiKey: '[OPENAI_API_KEY_REDACTED]',
  bearerToken: 'Bearer [TOKEN_REDACTED]',
  email: '[EMAIL_REDACTED]',
  filePath: '[PATH_REDACTED]',
  genericApiKey: 'api_key=[API_KEY_REDACTED]',
};

/**
 * Sanitizes a string by removing sensitive data
 * @param text - The text to sanitize
 * @returns Sanitized text with sensitive data redacted
 */
export function sanitizeString(text: string): string {
  let sanitized = text;

  // Redact OpenAI API keys
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.openaiKey, REDACTION_REPLACEMENTS.openaiKey);

  // Redact Bearer tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.bearerToken, REDACTION_REPLACEMENTS.bearerToken);

  // Redact email addresses
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, REDACTION_REPLACEMENTS.email);

  // Redact file paths
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.filePath, REDACTION_REPLACEMENTS.filePath);

  // Redact generic API keys
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.genericApiKey, REDACTION_REPLACEMENTS.genericApiKey);

  return sanitized;
}

/**
 * Sanitizes an Error object by redacting sensitive data from message and stack
 * @param error - The error to sanitize
 * @returns A new Error object with sanitized properties
 */
export function sanitizeError(error: Error): Error {
  const sanitizedError = new Error(sanitizeString(error.message));
  sanitizedError.name = error.name;

  // In production, strip stack traces completely
  // In development, sanitize but preserve for debugging
  if (isProduction()) {
    sanitizedError.stack = `${error.name}: ${sanitizedError.message}`;
  } else if (error.stack) {
    sanitizedError.stack = sanitizeString(error.stack);
  }

  // Copy over any custom properties from the original error
  Object.keys(error).forEach((key) => {
    if (key !== 'message' && key !== 'stack' && key !== 'name') {
      const value = (error as any)[key];
      if (typeof value === 'string') {
        (sanitizedError as any)[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        (sanitizedError as any)[key] = sanitizeObject(value);
      } else {
        (sanitizedError as any)[key] = value;
      }
    }
  });

  return sanitizedError;
}

/**
 * Sanitizes an object by redacting sensitive data from all string properties
 * @param obj - The object to sanitize
 * @returns A new object with sanitized string values
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Safe error logging function that automatically sanitizes error messages
 * Use this instead of console.error to prevent leaking sensitive data
 * @param message - Description of the error context
 * @param error - The error object or any data to log
 */
export function logError(message: string, error?: unknown): void {
  const sanitizedMessage = sanitizeString(message);

  if (error instanceof Error) {
    const sanitizedError = sanitizeError(error);
    console.log(`[ERROR] ${sanitizedMessage}:`, sanitizedError);
  } else if (error !== undefined) {
    const sanitizedData = typeof error === 'object' ? sanitizeObject(error) : sanitizeString(String(error));
    console.log(`[ERROR] ${sanitizedMessage}:`, sanitizedData);
  } else {
    console.log(`[ERROR] ${sanitizedMessage}`);
  }
}

/**
 * Safe warning logging function that automatically sanitizes messages
 * @param message - Warning message
 * @param data - Optional data to log
 */
export function logWarning(message: string, data?: unknown): void {
  const sanitizedMessage = sanitizeString(message);

  if (data !== undefined) {
    const sanitizedData = typeof data === 'object' ? sanitizeObject(data) : sanitizeString(String(data));
    console.log(`[WARN] ${sanitizedMessage}:`, sanitizedData);
  } else {
    console.log(`[WARN] ${sanitizedMessage}`);
  }
}

/**
 * Safe info logging function that automatically sanitizes messages
 * @param message - Info message
 * @param data - Optional data to log
 */
export function logInfo(message: string, data?: unknown): void {
  const sanitizedMessage = sanitizeString(message);

  if (data !== undefined) {
    const sanitizedData = typeof data === 'object' ? sanitizeObject(data) : sanitizeString(String(data));
    console.log(`[INFO] ${sanitizedMessage}:`, sanitizedData);
  } else {
    console.log(`[INFO] ${sanitizedMessage}`);
  }
}
