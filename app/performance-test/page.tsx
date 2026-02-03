'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  runMainPerformanceTest,
  runPerformanceTest,
  runPerformanceTestSuite,
  type PerformanceTestResult,
} from '@/lib/performance-test';

export default function PerformanceTestPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<PerformanceTestResult[]>([]);
  const [suiteResults, setSuiteResults] = useState<{
    tests: PerformanceTestResult[];
    allPassed: boolean;
    summary: string;
  } | null>(null);

  const runTest = async (
    testFn: () => Promise<
      | PerformanceTestResult
      | { tests: PerformanceTestResult[]; allPassed: boolean; summary: string }
    >,
    isSuite: boolean = false,
  ) => {
    setRunning(true);
    setResults([]);
    setSuiteResults(null);

    try {
      const result = await testFn();

      if (isSuite && 'tests' in result) {
        setSuiteResults(result);
        setResults(result.tests);
      } else if ('testName' in result) {
        setResults([result]);
      }
    } catch (error) {
      console.error('Test failed:', error);
      alert(`Test failed: ${error}`);
    } finally {
      setRunning(false);
    }
  };

  const formatTime = (ms: number): string => {
    return ms.toFixed(2) + 'ms';
  };

  const getStatusIcon = (passed: boolean): string => {
    return passed ? '✅' : '❌';
  };

  const getStatusColor = (passed: boolean): string => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="container mx-auto max-w-6xl p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Encryption Performance Test</h1>
        <p className="text-muted-foreground">
          Measure encryption overhead for large datasets (50+ voice items with audio)
        </p>
      </div>

      <div className="mb-8 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
            <CardDescription>
              Run individual performance tests with different configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => runTest(() => runMainPerformanceTest())}
              disabled={running}
              className="w-full"
            >
              {running ? 'Running...' : 'Run Main Test (50 items + audio)'}
            </Button>
            <Button
              onClick={() => runTest(() => runPerformanceTest(50, false, 500))}
              disabled={running}
              variant="outline"
              className="w-full"
            >
              Run Test: 50 items without audio
            </Button>
            <Button
              onClick={() => runTest(() => runPerformanceTest(100, true, 1000))}
              disabled={running}
              variant="outline"
              className="w-full"
            >
              Run Stress Test: 100 items + audio
            </Button>
            <Button
              onClick={() => runTest(() => runPerformanceTest(10, true, 200))}
              disabled={running}
              variant="outline"
              className="w-full"
            >
              Run Quick Test: 10 items + audio
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Test Suite</CardTitle>
            <CardDescription>
              Run all performance tests sequentially (takes ~10-20 seconds)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runTest(() => runPerformanceTestSuite(), true)}
              disabled={running}
              variant="default"
              className="w-full"
            >
              {running ? 'Running Full Suite...' : 'Run Full Test Suite'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {suiteResults && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className={getStatusColor(suiteResults.allPassed)}>
              {getStatusIcon(suiteResults.allPassed)} Test Suite Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap">{suiteResults.summary}</pre>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Results</h2>
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{result.testName}</span>
                  <span className={getStatusColor(result.passed)}>
                    {getStatusIcon(result.passed)} {result.passed ? 'PASS' : 'FAIL'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {result.itemCount} items • {result.dataSize}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-sm">Encryption Time</div>
                    <div
                      className={`text-2xl font-bold ${
                        result.encryptionTimeMs < result.threshold
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatTime(result.encryptionTimeMs)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Threshold: {formatTime(result.threshold)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">Decryption Time</div>
                    <div
                      className={`text-2xl font-bold ${
                        result.decryptionTimeMs < result.threshold
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatTime(result.decryptionTimeMs)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Threshold: {formatTime(result.threshold)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <div className="text-muted-foreground text-sm">Total Time</div>
                    <div className="text-lg font-semibold">{formatTime(result.totalTimeMs)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">Avg Item Size</div>
                    <div className="text-lg font-semibold">{result.details.avgItemSize}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <div className="text-muted-foreground text-sm">Encryption Rate</div>
                    <div className="text-lg font-semibold">{result.details.encryptionRate}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">Decryption Rate</div>
                    <div className="text-lg font-semibold">{result.details.decryptionRate}</div>
                  </div>
                </div>

                <div className="bg-muted mt-4 rounded-md p-3">
                  <div className="text-sm">
                    <div>
                      <strong>With Audio:</strong> {result.details.withAudio ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Data Size:</strong> {result.dataSize} (
                      {result.dataSizeBytes.toLocaleString()} bytes)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!running && results.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Run a test to see results here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
