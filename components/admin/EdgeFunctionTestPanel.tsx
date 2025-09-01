'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { 
  Play,
  CheckCircle2, 
  XCircle, 
  Loader2,
  Clock,
  Settings,
  Database,
  MessageSquare,
  Upload,
  Bell,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw
} from 'lucide-react';
import { EdgeFunctionTester, EdgeFunctionTestSuite, TestResult } from '@/lib/edge-functions/edgeFunctionTests';
import { cn } from '@/lib/utils';

export function EdgeFunctionTestPanel() {
  const supabase = useSupabaseClient();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [results, setResults] = useState<EdgeFunctionTestSuite[]>([]);
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const tester = new EdgeFunctionTester(supabase);

  const getFunctionIcon = (functionName: string) => {
    switch (functionName) {
      case 'cleanup-scheduler': return <Database className="h-4 w-4" />;
      case 'FEED_PROCESSOR': return <Settings className="h-4 w-4" />;
      case 'CONTENT_UPLOADER': return <Upload className="h-4 w-4" />;
      case 'MESSAGE_HANDLER': return <MessageSquare className="h-4 w-4" />;
      case 'PUSH_NOTIFICATIONS': return <Bell className="h-4 w-4" />;
      case 'MENU_ITEMS': return <UtensilsCrossed className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    try {
      const functionNames = [
        'cleanup-scheduler',
        'FEED_PROCESSOR', 
        'CONTENT_UPLOADER',
        'MESSAGE_HANDLER',
        'PUSH_NOTIFICATIONS',
        'MENU_ITEMS'
      ];

      const allResults: EdgeFunctionTestSuite[] = [];

      for (let i = 0; i < functionNames.length; i++) {
        const functionName = functionNames[i];
        setCurrentTest(`Testing ${functionName}...`);
        
        let testResult: EdgeFunctionTestSuite;
        
        switch (functionName) {
          case 'cleanup-scheduler':
            testResult = await tester.testCleanupScheduler();
            break;
          case 'FEED_PROCESSOR':
            testResult = await tester.testFeedProcessor();
            break;
          case 'CONTENT_UPLOADER':
            testResult = await tester.testContentUploader();
            break;
          case 'MESSAGE_HANDLER':
            testResult = await tester.testMessageHandler();
            break;
          case 'PUSH_NOTIFICATIONS':
            testResult = await tester.testPushNotifications();
            break;
          case 'MENU_ITEMS':
            testResult = await tester.testMenuItems();
            break;
          default:
            continue;
        }
        
        allResults.push(testResult);
        setResults([...allResults]);
        setProgress(((i + 1) / functionNames.length) * 100);
      }

      setCurrentTest('All tests completed!');
    } catch (error) {
      console.error('Error running tests:', error);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async (functionName: string) => {
    setIsRunning(true);
    setCurrentTest(`Testing ${functionName}...`);
    
    try {
      let testResult: EdgeFunctionTestSuite;
      
      switch (functionName) {
        case 'cleanup-scheduler':
          testResult = await tester.testCleanupScheduler();
          break;
        case 'FEED_PROCESSOR':
          testResult = await tester.testFeedProcessor();
          break;
        case 'CONTENT_UPLOADER':
          testResult = await tester.testContentUploader();
          break;
        case 'MESSAGE_HANDLER':
          testResult = await tester.testMessageHandler();
          break;
        case 'PUSH_NOTIFICATIONS':
          testResult = await tester.testPushNotifications();
          break;
        case 'MENU_ITEMS':
          testResult = await tester.testMenuItems();
          break;
        default:
          return;
      }
      
      setResults(prev => {
        const filtered = prev.filter(r => r.functionName !== functionName);
        return [...filtered, testResult];
      });
      
      setCurrentTest(`${functionName} test completed`);
    } catch (error) {
      console.error('Error running test:', error);
      setCurrentTest(`${functionName} test failed`);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleExpanded = (functionName: string) => {
    const newExpanded = new Set(expandedFunctions);
    if (newExpanded.has(functionName)) {
      newExpanded.delete(functionName);
    } else {
      newExpanded.add(functionName);
    }
    setExpandedFunctions(newExpanded);
  };

  const copyTestResult = (result: TestResult) => {
    const text = JSON.stringify({
      name: result.name,
      status: result.status,
      duration: result.duration,
      statusCode: result.statusCode,
      response: result.response,
      error: result.error
    }, null, 2);
    
    navigator.clipboard.writeText(text);
  };

  const getOverallSummary = () => {
    if (results.length === 0) return null;
    
    const total = results.reduce((sum, r) => sum + r.summary.total, 0);
    const passed = results.reduce((sum, r) => sum + r.summary.passed, 0);
    const failed = results.reduce((sum, r) => sum + r.summary.failed, 0);
    
    return { total, passed, failed };
  };

  const overallSummary = getOverallSummary();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Edge Functions Test Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for all 6 deployed edge functions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setResults([]);
              setProgress(0);
              setCurrentTest('');
            }}
            disabled={isRunning}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{currentTest}</p>
          </div>
        )}

        {/* Overall Summary */}
        {overallSummary && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Test Summary</AlertTitle>
            <AlertDescription>
              <div className="flex gap-4 mt-2">
                <Badge variant="outline">
                  Total: {overallSummary.total}
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  Passed: {overallSummary.passed}
                </Badge>
                <Badge variant="destructive">
                  Failed: {overallSummary.failed}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          {results.map((functionResult) => (
            <Card key={functionResult.functionName} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFunctionIcon(functionResult.functionName)}
                    <CardTitle className="text-lg">
                      {functionResult.functionName}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {functionResult.summary.passed}/{functionResult.summary.total}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runSingleTest(functionResult.functionName)}
                      disabled={isRunning}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(functionResult.functionName)}
                    >
                      {expandedFunctions.has(functionResult.functionName) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge 
                    variant="default" 
                    className="bg-green-600"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {functionResult.summary.passed} Passed
                  </Badge>
                  
                  {functionResult.summary.failed > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {functionResult.summary.failed} Failed
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* Expanded Test Details */}
              {expandedFunctions.has(functionResult.functionName) && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {functionResult.tests.map((test, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded border",
                          test.status === 'pass' ? "bg-green-50 dark:bg-green-950/20 border-green-200" :
                          test.status === 'fail' ? "bg-red-50 dark:bg-red-950/20 border-red-200" :
                          "bg-gray-50 dark:bg-gray-950/20"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {test.status === 'pass' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : test.status === 'fail' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-500" />
                          )}
                          
                          <div>
                            <p className="font-medium text-sm">{test.name}</p>
                            {test.error && (
                              <p className="text-xs text-red-600">{test.error}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {test.duration}ms
                          </Badge>
                          
                          {test.statusCode && (
                            <Badge 
                              variant={test.statusCode < 400 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {test.statusCode}
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTestResult(test)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Quick Test Buttons for Individual Functions */}
        <div className="grid gap-2 md:grid-cols-3">
          {[
            'cleanup-scheduler',
            'FEED_PROCESSOR',
            'CONTENT_UPLOADER',
            'MESSAGE_HANDLER',
            'PUSH_NOTIFICATIONS',
            'MENU_ITEMS'
          ].map((functionName) => (
            <Button
              key={functionName}
              variant="outline"
              size="sm"
              onClick={() => runSingleTest(functionName)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {getFunctionIcon(functionName)}
              <span className="text-xs">{functionName}</span>
            </Button>
          ))}
        </div>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-sm">Testing Instructions:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Ensure you&#39;re logged in as an admin user</li>
                <li>Check browser console for detailed logs</li>
                <li>Failed tests may indicate missing data or permissions</li>
                <li>Click individual function buttons for targeted testing</li>
                <li>Use &quot;Copy&quot; buttons to share test results with backend team</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}