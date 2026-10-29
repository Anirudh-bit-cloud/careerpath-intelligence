import React, { useId } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  id,
  checked,
  disabled,
  className = '',
  onChange,
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <div className={`flex items-start gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="relative flex items-center justify-center pt-0.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
          checked
            ? 'bg-cp-accent border-cp-accent text-white'
            : 'border-cp-border bg-cp-bg-input peer-focus-visible:ring-2 peer-focus-visible:ring-cp-accent'
        }`}>
          {checked && <Check className="w-3 h-3 stroke-3" />}
        </div>
      </div>
      {(label || description) && (
        <label htmlFor={checkboxId} className="select-none cursor-pointer">
          {label && <span className="block text-xs font-medium text-cp-text-primary">{label}</span>}
          {description && <span className="block text-[11px] text-cp-text-muted">{description}</span>}
        </label>
      )}
    </div>
  );
};
