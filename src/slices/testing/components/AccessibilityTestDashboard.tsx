import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Play,
  RefreshCw,
  Download
} from 'lucide-react';
import { AccessibilityTester, AccessibilityTestResult } from '../../../shared/utils/accessibilityTests';
import { useAccessibility } from '../../../shared/components/AccessibilityProvider';

export function AccessibilityTestDashboard() {
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const { announceMessage } = useAccessibility();

  const runAccessibilityTests = async () => {
    setIsRunning(true);
    announceMessage('Running accessibility tests', 'polite');

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const tester = new AccessibilityTester();
      const results = tester.runAllTests();
      
      setTestResults(results);
      setLastRunTime(new Date());
      
      const summary = tester.getSummary();
      announceMessage(
        `Accessibility tests completed. ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`,
        'polite'
      );
    } catch (error) {
      console.error('Error running accessibility tests:', error);
      announceMessage('Error running accessibility tests', 'assertive');
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    const summary = getSummary();
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      results: testResults.map(result => ({
        name: result.name,
        passed: result.passed,
        message: result.message,
        severity: result.severity,
        elementTag: result.element?.tagName,
        elementId: result.element?.id,
        elementClass: result.element?.className
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announceMessage('Accessibility report downloaded', 'polite');
  };

  const getSummary = () => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed && r.severity === 'error').length;
    const warnings = testResults.filter(r => !r.passed && r.severity === 'warning').length;
    return { total, passed, failed, warnings };
  };

  const getStatusIcon = (result: AccessibilityTestResult) => {
    if (result.passed) {
      return <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />;
    }
    
    switch (result.severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />;
    }
  };

  const getStatusColor = (result: AccessibilityTestResult) => {
    if (result.passed) return 'text-green-700 bg-green-50 border-green-200';
    
    switch (result.severity) {
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  // Run tests on component mount
  useEffect(() => {
    runAccessibilityTests();
  }, []);

  const summary = getSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Eye className="h-6 w-6 text-blue-600 mr-3" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Accessibility Testing
            </h2>
            <p className="text-sm text-gray-600">
              Automated accessibility compliance checks
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={runAccessibilityTests}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-describedby="run-tests-help"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
          
          {testResults.length > 0 && (
            <button
              onClick={exportResults}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Export accessibility test results"
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{summary.total}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Tests</p>
                <p className="text-xs text-gray-500">Accessibility checks run</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{summary.passed} Passed</p>
                <p className="text-xs text-gray-500">Tests completed successfully</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{summary.failed} Errors</p>
                <p className="text-xs text-gray-500">Critical accessibility issues</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{summary.warnings} Warnings</p>
                <p className="text-xs text-gray-500">Potential improvements</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
            {lastRunTime && (
              <p className="text-sm text-gray-500 mt-1">
                Last run: {lastRunTime.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="divide-y divide-gray-200">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 border-l-4 ${getStatusColor(result)}`}
                role="listitem"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        {result.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.passed 
                          ? 'bg-green-100 text-green-800'
                          : result.severity === 'error'
                          ? 'bg-red-100 text-red-800'
                          : result.severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {result.passed ? 'Passed' : result.severity}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {result.message}
                    </p>
                    {result.element && (
                      <div className="mt-2 text-xs text-gray-500">
                        Element: {result.element.tagName.toLowerCase()}
                        {result.element.id && ` #${result.element.id}`}
                        {result.element.className && ` .${result.element.className.split(' ').join('.')}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isRunning && testResults.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Running Accessibility Tests</h3>
          <p className="text-gray-600">
            Checking your application for accessibility compliance...
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Accessibility Testing
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                These automated tests check for common accessibility issues including:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Proper heading hierarchy (H1, H2, H3, etc.)</li>
                <li>Images with appropriate alt text</li>
                <li>Form inputs with proper labels</li>
                <li>Keyboard navigation support</li>
                <li>ARIA roles and properties</li>
                <li>Skip links for screen readers</li>
                <li>Color contrast considerations</li>
              </ul>
              <p className="mt-2">
                Note: Automated tests catch many issues but cannot replace manual testing with assistive technologies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden help text for screen readers */}
      <div className="sr-only">
        <p id="run-tests-help">
          Click to run automated accessibility tests on the current page
        </p>
      </div>
    </div>
  );
}