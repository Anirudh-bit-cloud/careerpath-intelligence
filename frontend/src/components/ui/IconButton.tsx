import React from 'react';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'secondary' | 'primary';
  isLoading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  'aria-label': ariaLabel,
  size = 'md',
  variant = 'ghost',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 p-1 text-[11px]',
    sm: 'w-7 h-7 p-1.5 text-xs',
    md: 'w-8 h-8 p-2 text-xs',
    lg: 'w-9 h-9 p-2.5 text-sm',
  };

  const variantStyles = {
    ghost: 'text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover active:bg-cp-bg-elevated',
    outline: 'border border-cp-border text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover',
    secondary: 'bg-cp-bg-elevated border border-cp-border text-cp-text-primary hover:bg-cp-bg-hover',
    primary: 'bg-cp-accent text-white hover:bg-cp-accent-hover active:opacity-95 shadow-xs',
  };

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cp-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : children}
    </button>
  );
};
