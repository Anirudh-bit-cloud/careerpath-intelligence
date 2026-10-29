import React from 'react';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  orgName?: string;
  badgeText?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 28,
  showWordmark = true,
  orgName = 'CareerPath',
  badgeText = 'ENTERPRISE',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Logo Glyph */}
      <div
        className="relative flex items-center justify-center rounded-lg bg-cp-accent/15 border border-cp-accent/30 text-cp-accent shrink-0 shadow-xs transition-transform hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer upward progression chevron */}
          <path d="M4 17L12 9L20 17" strokeOpacity="0.5" />
          {/* Inner forward vector */}
          <path d="M7 12L12 7L17 12" />
          {/* Anchor node */}
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </div>

      {showWordmark && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold tracking-tight text-cp-text-primary truncate">
              {orgName}
            </span>
            {badgeText && (
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cp-accent/15 text-cp-accent border border-cp-accent/25">
                {badgeText}
              </span>
            )}
          </div>
          <div className="text-[10px] text-cp-text-muted truncate leading-none mt-1">
            Workforce Progression Intelligence
          </div>
        </div>
      )}
    </div>
  );
};
