import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load workforce intelligence',
  message = 'An unexpected network error occurred while communicating with the analytics API. Please verify connectivity or retry.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-6 rounded-lg border border-rose-500/25 bg-rose-500/5 text-center max-w-lg mx-auto my-6 space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-cp-text-primary">{title}</h4>
        <p className="text-xs text-cp-text-secondary leading-relaxed max-w-sm mx-auto">
          {message}
        </p>
      </div>
      {onRetry && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};
