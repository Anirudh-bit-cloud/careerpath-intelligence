import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    window.location.hash = '#/overview';
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 sm:p-12 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[360px] text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="text-base font-bold text-cp-text-primary mb-1">
            {this.props.fallbackTitle || 'Unable to display this workspace view'}
          </h2>

          <p className="text-xs text-cp-text-muted leading-relaxed mb-6 max-w-md">
            An unexpected error occurred while rendering this component. The rest of the application remains operational. You can reload this view or return to the overview workspace.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>

            {this.props.showHomeButton !== false && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Home className="w-3.5 h-3.5" />}
                onClick={this.handleGoHome}
              >
                Workforce Overview
              </Button>
            )}
          </div>

          {/* Technical diagnostic disclosure in development only */}
          {import.meta.env?.DEV && this.state.error && (
            <details className="mt-8 text-left w-full p-3 rounded-lg bg-cp-bg-surface border border-cp-border text-[10px] font-mono text-cp-text-muted">
              <summary className="cursor-pointer font-bold uppercase tracking-wider text-cp-text-secondary select-none">
                Diagnostic Trace ({this.state.error.name})
              </summary>
              <div className="mt-2 text-rose-400 font-semibold">{this.state.error.message}</div>
              <pre className="mt-2 text-[9px] overflow-x-auto whitespace-pre-wrap leading-tight text-cp-text-muted">
                {this.state.errorInfo?.componentStack || this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
