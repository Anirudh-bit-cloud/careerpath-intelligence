import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  category?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  category,
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  icon,
  className = '',
}) => {
  return (
    <div className={`border-b border-cp-border pb-5 mb-6 space-y-3 ${className}`}>
      {/* Optional Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-cp-text-muted">
          {breadcrumbs.map((b, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-cp-text-muted/60 shrink-0" />}
                {b.onClick && !isLast ? (
                  <button
                    onClick={b.onClick}
                    className="hover:text-cp-text-primary transition-colors cursor-pointer"
                  >
                    {b.label}
                  </button>
                ) : (
                  <span className={isLast ? 'text-cp-text-secondary font-medium' : ''}>
                    {b.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {category && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-cp-accent flex items-center gap-1.5">
              {icon && <span className="w-3.5 h-3.5">{icon}</span>}
              <span>{category}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-cp-text-primary">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-xs text-cp-text-muted max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
