/**
 * React Error Boundary Component
 * Catches errors in React component tree and reports to ErrorTracker
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import { errorTracker } from "../services/ErrorTracker";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Report to error tracker
    errorTracker.captureException(error, {
      component: this.props.componentName || "ErrorBoundary",
      tags: {
        errorBoundary: "true",
        componentStack: errorInfo.componentStack?.substring(0, 100) || "",
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: "20px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            margin: "10px",
          }}
        >
          <h3 style={{ color: "#DC2626", margin: "0 0 10px 0" }}>
            ⚠️ Something went wrong
          </h3>
          <p style={{ color: "#7F1D1D", margin: "0 0 10px 0" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: "#DC2626",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          {import.meta.env.DEV && this.state.errorInfo && (
            <details style={{ marginTop: "10px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "#7F1D1D",
                  fontWeight: "bold",
                }}
              >
                Error Details (Development)
              </summary>
              <pre
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  background: "white",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                }}
              >
                {this.state.error?.stack}
                {"\n\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary componentName={componentName || Component.name}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
