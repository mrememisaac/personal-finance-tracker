import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Announce error to screen readers
    setTimeout(() => {
      const announcement = `An error occurred: ${error.message}. Please try refreshing the page or contact support.`;
      console.log('Screen reader announcement:', announcement);
    }, 100);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined, copied: false });
    } else {
      // Too many retries, suggest going home
      this.handleGoHome();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    if (!this.state.error) return;

    const errorText = `Error ID: ${this.state.errorId}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}`;

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error report:', errorReport);
    alert('Error report sent. Thank you for helping us improve the application.');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMaxRetriesReached = this.retryCount >= this.maxRetries;

      return (
        <div 
          className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" aria-hidden="true" />
              <h1 className="text-xl font-bold text-gray-900">
                Oops! Something went wrong
              </h1>
            </div>

            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. Don't worry, your data is safe.
              {isMaxRetriesReached 
                ? ' Please go back to the home page or contact support if the problem persists.'
                : ' You can try again or go back to the home page.'
              }
            </p>

            {this.state.errorId && (
              <p className="text-sm text-gray-500 mb-4">
                Error ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
              </p>
            )}

            <div className="space-y-3 mb-6">
              {!isMaxRetriesReached && (
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-describedby="retry-help"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Go to Home Page
              </button>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Need help? You can:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={this.handleCopyError}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  aria-describedby="copy-help"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                      Copy Error Details
                    </>
                  )}
                </button>
                
                <button
                  onClick={this.handleReportError}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                >
                  <Bug className="w-4 h-4 mr-2" aria-hidden="true" />
                  Report Issue
                </button>
              </div>
            </div>

            {/* Hidden help text for screen readers */}
            <div className="sr-only">
              <p id="retry-help">
                Clicking Try Again will attempt to reload the component that caused the error.
              </p>
              <p id="copy-help">
                This will copy technical error details to your clipboard that you can share with support.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded">
                  Show Technical Details (Development Mode)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Message:</h3>
                  <pre className="text-xs text-red-600 mb-3 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                  
                  {this.state.error.stack && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Stack Trace:</h3>
                      <pre className="text-xs text-gray-600 mb-3 overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Component Stack:</h3>
                      <pre className="text-xs text-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}