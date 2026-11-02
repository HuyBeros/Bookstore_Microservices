import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormField: bọc input với label và error message
 */
const FormField = ({
  label,
  required = false,
  error,
  children,
  helpText,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <div className="mt-1 flex items-center gap-1 text-red-600 text-sm" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {helpText && !error && (
        <p className="mt-1 text-gray-500 text-sm">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;
