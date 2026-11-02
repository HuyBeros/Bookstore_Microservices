import React from 'react';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  USER_STATUS_LABELS,
  USER_STATUS_COLORS,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
} from '../../utils/constants';

/**
 * StatusBadge: hiển thị trạng thái với màu sắc
 */
const StatusBadge = ({ type = 'order', value, className = '' }) => {
  let labels, colors;

  switch (type) {
    case 'order':
      labels = ORDER_STATUS_LABELS;
      colors = ORDER_STATUS_COLORS;
      break;
    case 'payment':
      labels = PAYMENT_STATUS_LABELS;
      colors = PAYMENT_STATUS_COLORS;
      break;
    case 'user-status':
      labels = USER_STATUS_LABELS;
      colors = USER_STATUS_COLORS;
      break;
    case 'user-role':
      labels = USER_ROLE_LABELS;
      colors = USER_ROLE_COLORS;
      break;
    default:
      return null;
  }

  const label = labels[value];
  const colorClass = colors[value];

  if (!label) return null;

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
