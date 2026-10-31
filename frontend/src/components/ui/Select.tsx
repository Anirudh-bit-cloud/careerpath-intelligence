import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  error,
  options,
  id,
  className = '',
  disabled,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-cp-text-secondary"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        disabled={disabled}
        className={`w-full rounded-md border bg-cp-bg-input px-3 py-1.5 text-xs text-cp-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cp-accent focus-visible:border-cp-accent disabled:opacity-50 disabled:bg-cp-bg-elevated cursor-pointer ${
          error
            ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500'
            : 'border-cp-border'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="bg-cp-bg-surface text-cp-text-primary"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-cp-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
