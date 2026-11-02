import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Button from './Button';
import LiteraryQuote from './LiteraryQuote';

/**
 * EmptyState: trạng thái không có dữ liệu
 */
const EmptyState = ({
  icon: Icon = ShoppingCart,
  title,
  description,
  action,
  actionLabel = 'Thực hiện',
  showQuote = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Icon size={44} className="text-ink-muted/40 mb-3" />
      <h3 className="text-lg font-semibold text-ink mb-2 font-serif">{title}</h3>
      {description && <p className="text-ink-body text-center mb-5 max-w-sm text-sm">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action}>
          {actionLabel}
        </Button>
      )}
      {showQuote && (
        <div className="mt-8 max-w-md w-full text-left">
          <LiteraryQuote variant="card" random={true} />
        </div>
      )}
    </div>
  );
};

export default EmptyState;
