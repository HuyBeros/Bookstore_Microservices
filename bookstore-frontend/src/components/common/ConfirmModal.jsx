import React, { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

/**
 * ConfirmModal: modal xác nhận hành động
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  loading = false,
  isDanger = true,
  children,
}) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className={`flex gap-3 ${message || children ? 'mb-4' : ''}`}>
        {isDanger && <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />}
        <div>
          {message && <p className="text-gray-700">{message}</p>}
          {children}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          ref={confirmButtonRef}
          variant={isDanger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
