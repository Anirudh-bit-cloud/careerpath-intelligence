import React, { useId } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  id,
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {(label || description) && (
        <label htmlFor={switchId} className="cursor-pointer select-none">
          {label && <span className="block text-xs font-medium text-cp-text-primary">{label}</span>}
          {description && <span className="block text-[11px] text-cp-text-muted">{description}</span>}
        </label>
      )}
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`w-9 h-5 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cp-accent cursor-pointer ${
          checked ? 'bg-cp-accent' : 'bg-cp-bg-elevated border border-cp-border'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
