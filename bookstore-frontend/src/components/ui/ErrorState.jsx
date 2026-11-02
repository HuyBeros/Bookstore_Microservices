import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

/**
 * ErrorState Component
 * Shown when an error occurs during data loading
 */
const ErrorState = ({
  title = 'Đã xảy ra lỗi',
  message = 'Vui lòng thử lại sau',
  onRetry,
  retryLabel = 'Thử lại',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`.trim()}>
      <AlertCircle className="w-12 h-12 text-danger mb-4" />
      <h3 className="text-heading-md font-semibold text-ink dark:text-ink mb-2">
        {title}
      </h3>
      <p className="text-body-sm text-ink-muted dark:text-ink-muted mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
