import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * PageHeader: tiêu đề trang + breadcrumb
 */
const PageHeader = ({ title, breadcrumb = [], actions = [], className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          {breadcrumb.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={16} className="text-gray-400" />}
              {item.link ? (
                <a href={item.link} className="hover:text-gray-900 transition-colors">
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
