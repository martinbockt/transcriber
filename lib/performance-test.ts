/**
 * Performance testing utility for encryption overhead measurement
 * Tests encryption/decryption performance with large datasets (50+ voice items)
 *
 * Usage: Call runPerformanceTest() in browser console or from test file
 */

import { encryptData, decryptData } from './crypto';
import type { VoiceItem, IntentType } from '@/types/voice-item';

export interface PerformanceTestResult {
  testName: string;
  itemCount: number;
  dataSize: string; // Human-readable size (e.g., "2.5 MB")
  dataSizeBytes: number;
  encryptionTimeMs: number;
  decryptionTimeMs: number;
  totalTimeMs: number;
  passed: boolean;
  threshold: number;
  details: {
    withAudio: boolean;
    avgItemSize: string;
    encryptionRate: string; // MB/s
    decryptionRate: string; // MB/s
  };
}

/**
 * Generates a random voice item with realistic content
 */
function generateMockVoiceItem(index: number, includeAudio: boolean): VoiceItem {
  const intents: IntentType[] = ['TODO', 'RESEARCH', 'DRAFT', 'NOTE'];
  const intent = intents[index % intents.length];

  // Generate realistic transcript (100-500 words)
  const transcriptLength = 100 + Math.floor(Math.random() * 400);
  const transcript = `This is a realistic voice transcript item number ${index}. `.repeat(
    Math.ceil(transcriptLength / 10)
  ).substring(0, transcriptLength * 5); // Average 5 chars per word

  // Generate base64-encoded audio data if requested (simulating 30 seconds of audio)
  // Real audio is approximately 480KB for 30s at 128kbps
  let audioData: string | undefined;
  if (includeAudio) {
    const audioSize = 480 * 1024; // 480 KB
    const buffer = new Uint8Array(audioSize);
    crypto.getRandomValues(buffer);
    audioData = btoa(String.fromCharCode(...buffer));
  }

  const baseItem: VoiceItem = {
    id: `test-item-${index}-${Date.now()}`,
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    originalTranscript: transcript,
    audioData,
    title: `Test Item ${index}: ${intent}`,
    tags: ['test', intent.toLowerCase(), `tag-${index % 5}`],
    summary: `This is a test summary for item ${index}. It contains realistic content to measure encryption performance. The summary is approximately 2-3 sentences long to match real-world usage patterns.`,
    keyFacts: [
      `Key fact 1 for item ${index}`,
      `Key fact 2 with date: ${new Date().toLocaleDateString()}`,
      `Key fact 3 with number: ${Math.floor(Math.random() * 1000)}`,
    ],
    intent,
    data: {},
  };

  // Add intent-specific data
  switch (intent) {
    case 'TODO':
      baseItem.data.todos = [
        { task: `Task 1 for item ${index}`, done: false },
        { task: `Task 2 for item ${index}`, done: Math.random() > 0.5 },
        { task: `Task 3 for item ${index}`, done: false, due: new Date(Date.now() + 86400000).toISOString() },
      ];
      break;
    case 'RESEARCH':
      baseItem.data.researchAnswer = `This is a detailed research answer for item ${index}. It contains multiple paragraphs with comprehensive information. `.repeat(5);
      break;
    case 'DRAFT':
      baseItem.data.draftContent = `This is polished draft content for item ${index}. It is well-formatted and ready to use. `.repeat(10);
      break;
    case 'NOTE':
      // No additional data for NOTE intent
      break;
  }

  return baseItem;
}

/**
 * Calculates human-readable size from bytes
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Calculates throughput in MB/s
 */
function calculateThroughput(bytes: number, milliseconds: number): string {
  const megabytes = bytes / (1024 * 1024);
  const seconds = milliseconds / 1000;
  return (megabytes / seconds).toFixed(2) + ' MB/s';
}

/**
 * Measures encryption performance for a dataset
 */
async function measureEncryption(items: VoiceItem[]): Promise<number> {
  const jsonString = JSON.stringify(items);

  const startTime = performance.now();
  await encryptData(jsonString);
  const endTime = performance.now();

  return endTime - startTime;
}

/**
 * Measures decryption performance for a dataset
 */
async function measureDecryption(encryptedData: string): Promise<number> {
  const startTime = performance.now();
  await decryptData(encryptedData);
  const endTime = performance.now();

  return endTime - startTime;
}

/**
 * Runs a complete performance test with specified parameters
 */
export async function runPerformanceTest(
  itemCount: number,
  includeAudio: boolean,
  thresholdMs: number = 500
): Promise<PerformanceTestResult> {
  console.log(`\n🔬 Starting performance test: ${itemCount} items (audio: ${includeAudio})...`);

  // Generate test data
  const items: VoiceItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(generateMockVoiceItem(i, includeAudio));
  }

  const jsonString = JSON.stringify(items);
  const dataSizeBytes = new TextEncoder().encode(jsonString).length;

  console.log(`📊 Generated ${itemCount} items, total size: ${formatBytes(dataSizeBytes)}`);

  // Measure encryption
  console.log('⏱️  Measuring encryption performance...');
  const encryptionTimeMs = await measureEncryption(items);
  console.log(`   ✓ Encryption completed in ${encryptionTimeMs.toFixed(2)}ms`);

  // Encrypt for decryption test
  const encrypted = await encryptData(jsonString);

  // Measure decryption
  console.log('⏱️  Measuring decryption performance...');
  const decryptionTimeMs = await measureDecryption(encrypted);
  console.log(`   ✓ Decryption completed in ${decryptionTimeMs.toFixed(2)}ms`);

  const totalTimeMs = encryptionTimeMs + decryptionTimeMs;
  const passed = encryptionTimeMs < thresholdMs && decryptionTimeMs < thresholdMs;

  const result: PerformanceTestResult = {
    testName: `${itemCount} items ${includeAudio ? 'with' : 'without'} audio`,
    itemCount,
    dataSize: formatBytes(dataSizeBytes),
    dataSizeBytes,
    encryptionTimeMs,
    decryptionTimeMs,
    totalTimeMs,
    passed,
    threshold: thresholdMs,
    details: {
      withAudio: includeAudio,
      avgItemSize: formatBytes(dataSizeBytes / itemCount),
      encryptionRate: calculateThroughput(dataSizeBytes, encryptionTimeMs),
      decryptionRate: calculateThroughput(dataSizeBytes, decryptionTimeMs),
    },
  };

  // Print summary
  console.log('\n📈 Performance Test Results:');
  console.log(`   Test: ${result.testName}`);
  console.log(`   Data Size: ${result.dataSize}`);
  console.log(`   Encryption: ${result.encryptionTimeMs.toFixed(2)}ms (${result.details.encryptionRate})`);
  console.log(`   Decryption: ${result.decryptionTimeMs.toFixed(2)}ms (${result.details.decryptionRate})`);
  console.log(`   Total Time: ${result.totalTimeMs.toFixed(2)}ms`);
  console.log(`   Status: ${result.passed ? '✅ PASS' : '❌ FAIL'} (threshold: ${thresholdMs}ms)`);

  return result;
}

/**
 * Runs comprehensive performance test suite
 * Tests multiple scenarios to validate encryption performance
 */
export async function runPerformanceTestSuite(): Promise<{
  tests: PerformanceTestResult[];
  allPassed: boolean;
  summary: string;
}> {
  console.log('🚀 Starting Comprehensive Performance Test Suite');
  console.log('━'.repeat(60));

  const tests: PerformanceTestResult[] = [];

  // Test 1: 50 items without audio (baseline)
  tests.push(await runPerformanceTest(50, false, 500));

  // Test 2: 50 items with audio (spec requirement)
  tests.push(await runPerformanceTest(50, true, 500));

  // Test 3: 100 items with audio (stress test)
  tests.push(await runPerformanceTest(100, true, 1000));

  // Test 4: 10 items with audio (quick test)
  tests.push(await runPerformanceTest(10, true, 200));

  const allPassed = tests.every(t => t.passed);

  // Generate summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('━'.repeat(60));

  tests.forEach((test, index) => {
    console.log(`\nTest ${index + 1}: ${test.testName}`);
    console.log(`  Encryption: ${test.encryptionTimeMs.toFixed(2)}ms / ${test.threshold}ms`);
    console.log(`  Decryption: ${test.decryptionTimeMs.toFixed(2)}ms / ${test.threshold}ms`);
    console.log(`  Result: ${test.passed ? '✅ PASS' : '❌ FAIL'}`);
  });

  console.log('\n' + '━'.repeat(60));
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('━'.repeat(60));

  const summary = `Performance Test Suite: ${allPassed ? 'PASSED' : 'FAILED'}\n` +
    `Tests run: ${tests.length}\n` +
    `Tests passed: ${tests.filter(t => t.passed).length}\n` +
    `Tests failed: ${tests.filter(t => !t.passed).length}`;

  return {
    tests,
    allPassed,
    summary,
  };
}

/**
 * Quick helper to run the main test (50+ items with audio)
 * This is the test specified in the verification criteria
 */
export async function runMainPerformanceTest(): Promise<PerformanceTestResult> {
  console.log('🎯 Running Main Performance Test (Spec Requirement)');
  console.log('   - 50+ voice items with audio');
  console.log('   - Encryption threshold: <500ms');
  console.log('   - Decryption threshold: <500ms');
  console.log('');

  return await runPerformanceTest(50, true, 500);
}
