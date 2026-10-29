import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from './Button';

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records by ID, role, department...',
  children,
  activeFiltersCount = 0,
  onClearFilters,
  className = '',
}) => {
  return (
    <div
      className={`p-3 rounded-lg border border-cp-border bg-cp-bg-surface flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {onSearchChange !== undefined && (
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-cp-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-cp-border bg-cp-bg-input text-xs text-cp-text-primary placeholder:text-cp-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cp-accent"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cp-text-muted hover:text-cp-text-primary cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>

      {activeFiltersCount > 0 && onClearFilters && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-cp-text-muted font-mono">
            {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearFilters}
            leftIcon={<X className="w-3 h-3" />}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
