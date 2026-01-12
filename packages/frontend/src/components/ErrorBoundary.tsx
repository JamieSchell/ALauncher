/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
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
        <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '32px', maxWidth: '672px', width: '100%', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(248, 113, 113)" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  Something went wrong
                </h1>
                <p style={{ color: '#9ca3af' }}>
                  An unexpected error occurred. The error has been logged and we'll look into it.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div style={{ marginBottom: '24px' }}>
                <details style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '16px' }}>
                  <summary style={{ fontSize: '14px', color: '#9ca3af', cursor: 'pointer', marginBottom: '8px' }}>
                    Error details (click to expand)
                  </summary>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Error message:</p>
                      <p style={{ fontSize: '14px', color: 'rgb(248, 113, 113)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Stack trace:</p>
                        <pre style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', overflow: 'auto', maxHeight: '192px', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '8px', borderRadius: '4px' }}>
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Component stack:</p>
                        <pre style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', overflow: 'auto', maxHeight: '192px', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '8px', borderRadius: '4px' }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: 'rgb(99, 102, 241)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                <span>Try again</span>
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
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
