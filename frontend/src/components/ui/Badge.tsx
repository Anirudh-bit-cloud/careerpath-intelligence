import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'urgent' | 'warning' | 'success' | 'info' | 'neutral' | 'accent';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25',
    neutral: 'bg-cp-bg-elevated text-cp-text-secondary border border-cp-border',
    accent: 'bg-cp-accent/10 text-cp-accent border border-cp-accent/25',
  };

  const dotColors = {
    urgent: 'bg-rose-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    info: 'bg-sky-500',
    neutral: 'bg-cp-text-muted',
    accent: 'bg-cp-accent',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium font-mono tabular-nums rounded-md whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
