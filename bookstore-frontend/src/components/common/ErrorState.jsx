import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * ErrorState: trạng thái lỗi
 */
const ErrorState = ({ message = 'Có lỗi xảy ra', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
      <p className="text-gray-600 text-center mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
