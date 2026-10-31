import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className={`w-full ${widthStyles[width]} h-full bg-cp-bg-surface border-l border-cp-border shadow-2xl flex flex-col`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-cp-border flex items-start justify-between gap-4 shrink-0 bg-cp-bg-surface">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-cp-text-primary">{title}</h3>
            {subtitle && (
              <p className="text-xs text-cp-text-muted leading-relaxed">{subtitle}</p>
            )}
          </div>
          <IconButton
            aria-label="Close drawer"
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Drawer Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-cp-text-secondary flex-1">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-cp-border bg-cp-bg-elevated/40 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
