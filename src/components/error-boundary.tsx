"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-8">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Your data is safe, but the app needs to recover.
            </p>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
