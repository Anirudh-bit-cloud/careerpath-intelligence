import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-cp-text-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-2.5 text-cp-text-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full rounded-md border bg-cp-bg-input px-3 py-1.5 text-xs text-cp-text-primary placeholder:text-cp-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cp-accent focus-visible:border-cp-accent disabled:opacity-50 disabled:bg-cp-bg-elevated ${
            leftIcon ? 'pl-8' : ''
          } ${rightIcon ? 'pr-8' : ''} ${
            error
              ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500'
              : 'border-cp-border'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-2.5 text-cp-text-muted flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-cp-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
