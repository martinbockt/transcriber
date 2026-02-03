import { logError } from './error-sanitizer';

/**
 * Configuration for the RateLimiter
 */
export interface RateLimiterConfig {
  maxTokens: number; // Maximum number of tokens in the bucket
  refillRate: number; // Tokens added per second
  initialTokens?: number; // Initial number of tokens (defaults to maxTokens)
}

/**
 * Token bucket rate limiter implementation
 *
 * The token bucket algorithm maintains a bucket of tokens that refill at a constant rate.
 * Each request consumes one token. If no tokens are available, the request is blocked.
 *
 * This is useful for rate limiting API calls or other resources.
 */
export class RateLimiter {
  private maxTokens: number;
  private refillRate: number;
  private tokens: number;
  private lastRefillTime: number;

  /**
   * Creates a new RateLimiter instance
   * @param config - Configuration for the rate limiter
   */
  constructor(config: RateLimiterConfig) {
    this.maxTokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.tokens = config.initialTokens ?? config.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Refills tokens based on elapsed time since last refill
   * @private
   */
  private refill(): void {
    try {
      const now = Date.now();
      const timeSinceLastRefill = (now - this.lastRefillTime) / 1000; // Convert to seconds

      // Calculate tokens to add based on refill rate
      const tokensToAdd = timeSinceLastRefill * this.refillRate;

      // Add tokens but don't exceed max capacity
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    } catch (err) {
      logError('Failed to refill tokens', err);
    }
  }

  /**
   * Attempts to acquire a token
   * @param cost - Number of tokens to acquire (defaults to 1)
   * @returns true if token was acquired, false if rate limit exceeded
   */
  acquire(cost: number = 1): boolean {
    try {
      // Validate cost
      if (cost <= 0) {
        throw new Error('Token cost must be positive');
      }
      if (cost > this.maxTokens) {
        throw new Error('Token cost exceeds maximum bucket capacity');
      }

      // Refill tokens before checking availability
      this.refill();

      // Check if enough tokens are available
      if (this.tokens >= cost) {
        this.tokens -= cost;
        return true;
      }

      return false;
    } catch (err) {
      logError('Failed to acquire token', err);
      return false;
    }
  }

  /**
   * Gets the number of tokens currently available
   * @returns Current token count (after refill)
   */
  getAvailableTokens(): number {
    try {
      this.refill();
      return Math.floor(this.tokens);
    } catch (err) {
      logError('Failed to get available tokens', err);
      return 0;
    }
  }

  /**
   * Calculates time in milliseconds until a specific number of tokens will be available
   * @param tokens - Number of tokens needed (defaults to 1)
   * @returns Time in milliseconds until tokens are available, or 0 if already available
   */
  getTimeUntilTokensAvailable(tokens: number = 1): number {
    try {
      this.refill();

      // If tokens are already available, return 0
      if (this.tokens >= tokens) {
        return 0;
      }

      // Calculate deficit and time needed to refill
      const tokensNeeded = tokens - this.tokens;
      const timeNeeded = (tokensNeeded / this.refillRate) * 1000; // Convert to milliseconds

      return Math.ceil(timeNeeded);
    } catch (err) {
      logError('Failed to calculate time until tokens available', err);
      return 0;
    }
  }

  /**
   * Resets the rate limiter to initial state
   * @param tokens - Number of tokens to reset to (defaults to maxTokens)
   */
  reset(tokens?: number): void {
    try {
      this.tokens = tokens ?? this.maxTokens;
      this.lastRefillTime = Date.now();
    } catch (err) {
      logError('Failed to reset rate limiter', err);
    }
  }
}

/**
 * Creates a rate limiter with a simple requests-per-minute configuration
 * @param requestsPerMinute - Maximum number of requests allowed per minute
 * @param burst - Optional burst capacity (defaults to requestsPerMinute)
 * @returns RateLimiter instance
 */
export function createRateLimiter(requestsPerMinute: number, burst?: number): RateLimiter {
  const refillRate = requestsPerMinute / 60; // Convert to requests per second
  const maxTokens = burst ?? requestsPerMinute;

  return new RateLimiter({
    maxTokens,
    refillRate,
  });
}
