// Node.js test for rate limiter
// Run with: node test-rate-limiter.mjs

class RateLimiter {
  constructor(config) {
    this.maxTokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.tokens = config.initialTokens ?? config.maxTokens;
    this.lastRefillTime = Date.now();
  }

  refill() {
    try {
      const now = Date.now();
      const timeSinceLastRefill = (now - this.lastRefillTime) / 1000;
      const tokensToAdd = timeSinceLastRefill * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    } catch (err) {
      console.error('Failed to refill tokens:', err);
    }
  }

  acquire(cost = 1) {
    try {
      if (cost <= 0) {
        throw new Error('Token cost must be positive');
      }
      if (cost > this.maxTokens) {
        throw new Error('Token cost exceeds maximum bucket capacity');
      }

      this.refill();

      if (this.tokens >= cost) {
        this.tokens -= cost;
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to acquire token:', err);
      return false;
    }
  }

  getAvailableTokens() {
    try {
      this.refill();
      return Math.floor(this.tokens);
    } catch (err) {
      console.error('Failed to get available tokens:', err);
      return 0;
    }
  }

  getTimeUntilTokensAvailable(tokens = 1) {
    try {
      this.refill();
      if (this.tokens >= tokens) {
        return 0;
      }
      const tokensNeeded = tokens - this.tokens;
      const timeNeeded = (tokensNeeded / this.refillRate) * 1000;
      return Math.ceil(timeNeeded);
    } catch (err) {
      console.error('Failed to calculate time until tokens available:', err);
      return 0;
    }
  }

  reset(tokens) {
    try {
      this.tokens = tokens ?? this.maxTokens;
      this.lastRefillTime = Date.now();
    } catch (err) {
      console.error('Failed to reset rate limiter:', err);
    }
  }
}

function createRateLimiter(requestsPerMinute, burst) {
  const refillRate = requestsPerMinute / 60;
  const maxTokens = burst ?? requestsPerMinute;
  return new RateLimiter({ maxTokens, refillRate });
}

// Run tests
async function runTests() {
  console.log('=== Test 1: Basic Rate Limiting ===');
  const limiter = new RateLimiter({
    maxTokens: 5,
    refillRate: 1, // 1 token per second
  });

  console.log('Initial tokens:', limiter.getAvailableTokens());

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < 10; i++) {
    const success = limiter.acquire();
    if (success) {
      successCount++;
      console.log(`Request ${i + 1}: ✓ Success (${limiter.getAvailableTokens()} tokens left)`);
    } else {
      failCount++;
      console.log(`Request ${i + 1}: ✗ Rate limited (${limiter.getAvailableTokens()} tokens left)`);
    }
  }

  console.log(`\nResults: ${successCount} successful, ${failCount} rate-limited`);
  console.log('Expected: First 5 succeed, next 5 fail');
  console.log(successCount === 5 && failCount === 5 ? '✓ Test 1 PASSED\n' : '✗ Test 1 FAILED\n');

  // Test 2: Token refill
  console.log('=== Test 2: Token Refill ===');
  console.log('Waiting 2 seconds for token refill...');

  await new Promise(resolve => setTimeout(resolve, 2000));

  const tokensAfter = limiter.getAvailableTokens();
  console.log('Tokens after 2 seconds:', tokensAfter);
  console.log('Expected: ~2 tokens (2 seconds × 1 token/second)');
  console.log(tokensAfter >= 1 && tokensAfter <= 2 ? '✓ Test 2 PASSED\n' : '✗ Test 2 FAILED\n');

  const success = limiter.acquire();
  console.log('Can acquire token?', success ? '✓ Yes' : '✗ No');

  // Test 3: Time until available
  console.log('\n=== Test 3: Time Until Available ===');
  const timeUntil = limiter.getTimeUntilTokensAvailable(3);
  console.log(`Time until 3 tokens available: ${timeUntil}ms`);
  console.log(timeUntil > 0 ? '✓ Test 3 PASSED\n' : '✗ Test 3 FAILED\n');

  // Test 4: Helper function
  console.log('=== Test 4: Helper Function ===');
  const simpleLimiter = createRateLimiter(60); // 60 requests per minute
  console.log('Created limiter with 60 req/min');
  console.log('Available tokens:', simpleLimiter.getAvailableTokens());
  console.log('Expected: 60 tokens');
  console.log(simpleLimiter.getAvailableTokens() === 60 ? '✓ Test 4 PASSED\n' : '✗ Test 4 FAILED\n');

  // Test 5: Rapid calls verification
  console.log('=== Test 5: Rapid Calls (Core Verification) ===');
  const rapidLimiter = new RateLimiter({
    maxTokens: 3,
    refillRate: 0.5, // 0.5 tokens per second
  });

  console.log('Testing rapid acquire() calls with max 3 tokens...');
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(rapidLimiter.acquire());
  }

  const rapidSuccess = results.filter(r => r).length;
  const rapidFail = results.filter(r => !r).length;

  console.log(`Rapid results: ${rapidSuccess} success, ${rapidFail} blocked`);
  console.log('Expected: 3 success, 2 blocked');
  console.log(rapidSuccess === 3 && rapidFail === 2 ? '✓ Test 5 PASSED\n' : '✗ Test 5 FAILED\n');

  console.log('=== All Tests Completed ===');
}

runTests().catch(console.error);
