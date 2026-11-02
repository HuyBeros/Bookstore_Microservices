import React from 'react';

/**
 * PageHeader Component
 * Page title, breadcrumb, action buttons
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`.trim()}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="flex items-center gap-2 mb-4 text-caption text-ink-muted dark:text-ink-muted">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="text-primary hover:underline dark:text-primary-light">
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-ink dark:text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-body-md text-ink-muted dark:text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
