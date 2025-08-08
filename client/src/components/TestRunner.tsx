import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: Test[];
}

interface Test {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: any;
}

interface TestRunnerProps {
  suiteId: string;
  onComplete?: (results: Test[]) => void;
}

export function TestRunner({ suiteId, onComplete }: TestRunnerProps) {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<Test[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTestSuite();
  }, [suiteId]);

  const loadTestSuite = async () => {
    try {
      // In a real implementation, this would load from an API
      // For now, we'll use mock data based on the suite type
      const mockSuites: Record<string, TestSuite> = {
        integration: {
          id: 'integration',
          name: 'Integration Tests',
          description: 'End-to-end system integration tests',
          tests: [
            {
              id: 'auth-login',
              name: 'User Authentication',
              description: 'Test login flow with valid credentials',
              status: 'pending'
            },
            {
              id: 'book-access',
              name: 'Book Access Control',
              description: 'Test subscription-based book access',
              status: 'pending'
            },
            {
              id: 'payment-stripe',
              name: 'Payment Processing',
              description: 'Test Stripe payment integration',
              status: 'pending'
            },
            {
              id: 'pdf-streaming',
              name: 'PDF Streaming',
              description: 'Test secure PDF token delivery',
              status: 'pending'
            },
            {
              id: 'email-notifications',
              name: 'Email Automation',
              description: 'Test email reminder system',
              status: 'pending'
            }
          ]
        },
        accessibility: {
          id: 'accessibility',
          name: 'Accessibility Tests',
          description: 'WCAG 2.1 AA compliance tests',
          tests: [
            {
              id: 'keyboard-nav',
              name: 'Keyboard Navigation',
              description: 'Test full keyboard accessibility',
              status: 'pending'
            },
            {
              id: 'screen-reader',
              name: 'Screen Reader Support',
              description: 'Test ARIA labels and semantic structure',
              status: 'pending'
            },
            {
              id: 'color-contrast',
              name: 'Color Contrast',
              description: 'Test WCAG AA color contrast ratios',
              status: 'pending'
            },
            {
              id: 'text-resize',
              name: 'Text Scaling',
              description: 'Test 200% text zoom compatibility',
              status: 'pending'
            },
            {
              id: 'focus-indicators',
              name: 'Focus Indicators',
              description: 'Test visible focus indicators',
              status: 'pending'
            }
          ]
        },
        performance: {
          id: 'performance',
          name: 'Performance Tests',
          description: 'Application performance and optimization tests',
          tests: [
            {
              id: 'page-load-speed',
              name: 'Page Load Speed',
              description: 'Test initial page load performance',
              status: 'pending'
            },
            {
              id: 'pdf-render-perf',
              name: 'PDF Rendering Performance',
              description: 'Test PDF.js rendering efficiency',
              status: 'pending'
            },
            {
              id: 'mobile-performance',
              name: 'Mobile Performance',
              description: 'Test performance on mobile devices',
              status: 'pending'
            },
            {
              id: 'memory-usage',
              name: 'Memory Usage',
              description: 'Test memory consumption patterns',
              status: 'pending'
            },
            {
              id: 'network-efficiency',
              name: 'Network Efficiency',
              description: 'Test API response times and caching',
              status: 'pending'
            }
          ]
        }
      };

      const suite = mockSuites[suiteId];
      if (suite) {
        setTestSuite(suite);
        setResults(suite.tests);
      }
    } catch (error) {
      console.error('Failed to load test suite:', error);
      toast({
        title: "Error",
        description: "Failed to load test suite",
        variant: "destructive"
      });
    }
  };

  const runTests = async () => {
    if (!testSuite || isRunning) return;

    setIsRunning(true);
    setResults(testSuite.tests.map(test => ({ ...test, status: 'pending' })));

    for (const test of testSuite.tests) {
      setCurrentTest(test.id);
      
      // Update test to running status
      setResults(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ));

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

      // Simulate test result
      const duration = parseFloat((Math.random() * 3 + 0.5).toFixed(1));
      const passed = Math.random() > 0.15; // 85% pass rate
      
      const result: Test = {
        ...test,
        status: passed ? 'passed' : 'failed',
        duration,
        error: passed ? undefined : `Test failed: ${getRandomError()}`
      };

      setResults(prev => prev.map(t => 
        t.id === test.id ? result : t
      ));
    }

    setIsRunning(false);
    setCurrentTest(null);
    
    if (onComplete) {
      onComplete(results);
    }
  };

  const getRandomError = () => {
    const errors = [
      'Assertion failed: Expected element to be visible',
      'Timeout: Element not found within 5000ms',
      'Color contrast ratio below WCAG AA standard',
      'Performance benchmark not met',
      'API response time exceeded threshold'
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  };

  const stopTests = () => {
    setIsRunning(false);
    setCurrentTest(null);
    setResults(prev => prev.map(test => 
      test.status === 'running' ? { ...test, status: 'pending' } : test
    ));
  };

  const getStatusIcon = (status: string, isActive: boolean = false) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'skipped':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalTests = results.length;
  const completedTests = results.filter(t => ['passed', 'failed', 'skipped'].includes(t.status)).length;
  const passedTests = results.filter(t => t.status === 'passed').length;
  const failedTests = results.filter(t => t.status === 'failed').length;
  const progress = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  if (!testSuite) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading test suite...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{testSuite.name}</CardTitle>
            <CardDescription>{testSuite.description}</CardDescription>
          </div>
          <div className="flex space-x-2">
            {!isRunning ? (
              <Button onClick={runTests} className="bg-green-600 hover:bg-green-700">
                <PlayCircle className="w-4 h-4 mr-2" />
                Run Tests
              </Button>
            ) : (
              <Button onClick={stopTests} variant="destructive">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>
        
        {isRunning && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {completedTests}/{totalTests} tests</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {completedTests > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {passedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0}%
              </div>
              <div className="text-sm text-blue-700">Success Rate</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {results.map((test) => (
            <div 
              key={test.id} 
              className={`p-4 border rounded-lg ${
                currentTest === test.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status, currentTest === test.id)}
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}s</span>
                  )}
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              </div>
              
              {test.error && (
                <Alert className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {test.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}