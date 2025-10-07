import React, { useState, useContext } from 'react';
import { TestTube, CheckCircle, XCircle, Clock, Play, Download, RefreshCw } from 'lucide-react';
import { AppContext } from '../../../shared/context/AppContext';
import { TestService, type TestResults, type TestSuite } from '../TestService';

export function TestDashboard() {
  const { state, dispatch } = useContext(AppContext);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);

  const testService = new TestService(state, dispatch);

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const results = testService.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleSuite = async (suiteName: string) => {
    setIsRunning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      let suite: TestSuite;
      
      switch (suiteName) {
        case 'Calculation Tests':
          suite = testService.runCalculationTests();
          break;
        case 'Data Integrity Tests':
          suite = testService.runDataIntegrityTests();
          break;
        case 'UI Tests':
          suite = testService.runUITests();
          break;
        case 'Validation Tests':
          suite = testService.runValidationTests();
          break;
        case 'Utility Tests':
          suite = testService.runUtilityTests();
          break;
        case 'Storage Tests':
          suite = testService.runStorageTests();
          break;
        case 'Edge Case Tests':
          suite = testService.runEdgeCaseTests();
          break;
        case 'Error Handling Tests':
          suite = testService.runErrorHandlingTests();
          break;
        case 'Test Infrastructure Tests':
          suite = testService.runTestInfrastructureTests();
          break;
        default:
          return;
      }

      // Update the results with the new suite
      if (testResults) {
        const updatedSuites = testResults.suites.map(s => 
          s.name === suiteName ? suite : s
        );
        const updatedResults = {
          ...testResults,
          suites: updatedSuites,
          totalPassed: updatedSuites.reduce((sum, s) => sum + s.passed, 0),
          totalFailed: updatedSuites.reduce((sum, s) => sum + s.failed, 0),
        };
        setTestResults(updatedResults);
      }
    } catch (error) {
      console.error('Error running suite:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportTestReport = () => {
    if (!testResults) return;
    
    const report = testService.generateTestReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (passed: boolean) => {
    return passed ? 'bg-green-50' : 'bg-red-50';
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Test Suite Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TestTube className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Test Suite Status
            </h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Running...' : 'Run All Tests'}
            </button>
            {testResults && (
              <button
                onClick={exportTestReport}
                className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            )}
          </div>
        </div>

        {testResults ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Passed Tests
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {testResults.totalPassed}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">
                    Failed Tests
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {testResults.totalFailed}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Total Duration
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {testResults.totalDuration}ms
                </p>
              </div>
            </div>

            {/* Test Suites */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Test Suites</h4>
              <div className="space-y-2">
                {testResults.suites.map((suite) => (
                  <div key={suite.name} className="border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedSuite(selectedSuite === suite.name ? null : suite.name)}
                    >
                      <div className="flex items-center">
                        {suite.failed === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{suite.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">
                          {suite.passed}/{suite.tests.length} passed
                        </span>
                        <span className="text-xs text-gray-500">
                          {suite.duration}ms
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runSingleSuite(suite.name);
                          }}
                          disabled={isRunning}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Rerun
                        </button>
                      </div>
                    </div>
                    
                    {selectedSuite === suite.name && (
                      <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <div className="space-y-2">
                          {suite.tests.map((test, index) => (
                            <div 
                              key={index}
                              className={`p-2 rounded text-xs ${getStatusBg(test.passed)}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-medium ${getStatusColor(test.passed)}`}>
                                  {test.passed ? '✓' : '✗'} {test.name}
                                </span>
                                <span className="text-gray-500">{test.duration}ms</span>
                              </div>
                              {!test.passed && (
                                <div className="mt-1 space-y-1">
                                  <div>
                                    <span className="font-medium">Expected:</span> {JSON.stringify(test.expected)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Actual:</span> {JSON.stringify(test.actual)}
                                  </div>
                                  {test.error && (
                                    <div>
                                      <span className="font-medium">Error:</span> {test.error}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No test results available</p>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>
        )}
      </div>

      {/* Test Coverage */}
      {testResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Coverage
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Coverage</span>
                <span>{testResults.coverage.overall}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getCoverageColor(testResults.coverage.overall)}`}
                  style={{ width: `${testResults.coverage.overall}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Models</span>
                <span>{testResults.coverage.models}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getCoverageColor(testResults.coverage.models)}`}
                  style={{ width: `${testResults.coverage.models}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Services</span>
                <span>{testResults.coverage.services}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getCoverageColor(testResults.coverage.services)}`}
                  style={{ width: `${testResults.coverage.services}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Components</span>
                <span>{testResults.coverage.components}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getCoverageColor(testResults.coverage.components)}`}
                  style={{ width: `${testResults.coverage.components}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Utilities</span>
                <span>{testResults.coverage.utilities}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getCoverageColor(testResults.coverage.utilities)}`}
                  style={{ width: `${testResults.coverage.utilities}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Coverage Documentation */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Coverage Explanation</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Models:</strong> Tests for business logic in Transaction, Budget, Goal, and Account classes</p>
              <p><strong>Services:</strong> Tests for data operations, calculations, and storage functionality</p>
              <p><strong>Components:</strong> Tests for UI formatting, display logic, and user interactions</p>
              <p><strong>Utilities:</strong> Tests for helper functions, validation, and data manipulation</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Infrastructure Self-Test */}
      {testResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Infrastructure Health
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Test Execution</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total Test Suites:</span>
                  <span className="font-medium">{testResults.suites.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Suite Duration:</span>
                  <span className="font-medium">
                    {Math.round(testResults.totalDuration / testResults.suites.length)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className={`font-medium ${
                    testResults.totalFailed === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((testResults.totalPassed / testResults.totalTests) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Test Categories</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Calculation Tests:</span>
                  <span className="font-medium">
                    {testResults.suites.find(s => s.name === 'Calculation Tests')?.tests.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Validation Tests:</span>
                  <span className="font-medium">
                    {testResults.suites.find(s => s.name === 'Validation Tests')?.tests.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Edge Case Tests:</span>
                  <span className="font-medium">
                    {testResults.suites.find(s => s.name === 'Edge Case Tests')?.tests.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}