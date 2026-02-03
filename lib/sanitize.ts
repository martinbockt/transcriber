/**
 * Sanitization utilities for AI-generated content
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

/**
 * Validates that a link URL uses a safe protocol
 * @param href - The URL to validate
 * @returns true if the protocol is safe (http, https, or mailto), false otherwise
 */
export function isValidLinkProtocol(href: string | undefined | null): boolean {
  if (!href || typeof href !== 'string') {
    return false;
  }

  // Handle relative URLs (they're safe)
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
    return true;
  }

  try {
    const url = new URL(href, 'http://localhost');
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch {
    // If URL parsing fails, treat as relative/invalid
    // Relative URLs without protocol are generally safe
    return !href.includes(':');
  }
}
