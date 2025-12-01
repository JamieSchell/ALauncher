/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import ErrorLoggerService from '../services/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to backend
    ErrorLoggerService.logUIError(error, errorInfo, {
      component: 'ErrorBoundary',
      action: 'component_did_catch',
    }).catch(() => {
      // Silently fail to prevent infinite loops
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800/60 backdrop-blur-xl border border-white/15 rounded-2xl p-8 max-w-2xl w-full shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-400">
                  An unexpected error occurred. The error has been logged and we'll look into it.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <details className="bg-black/30 rounded-lg p-4">
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 mb-2">
                    Error details (click to expand)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Error message:</p>
                      <p className="text-sm text-red-300 font-mono break-all">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Stack trace:</p>
                        <pre className="text-xs text-gray-400 font-mono overflow-auto max-h-48 bg-black/50 p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Component stack:</p>
                        <pre className="text-xs text-gray-400 font-mono overflow-auto max-h-48 bg-black/50 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                <span>Try again</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home size={18} />
                <span>Go home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

