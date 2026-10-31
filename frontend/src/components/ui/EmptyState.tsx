import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center rounded-lg border border-dashed border-cp-border bg-cp-bg-surface/50 max-w-lg mx-auto my-6 space-y-3 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-cp-bg-elevated text-cp-text-muted flex items-center justify-center mx-auto">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-cp-text-primary">{title}</h4>
        <p className="text-xs text-cp-text-muted leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>
      {action && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};
