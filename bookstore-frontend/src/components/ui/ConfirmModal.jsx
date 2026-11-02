import React from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * ConfirmModal Component
 * Confirmation dialog with custom message and callbacks
 */
const ConfirmModal = ({
  isOpen,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'primary', // primary | danger
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      overlayClick={!loading}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children || (
        <p className="text-body-md text-ink dark:text-ink">
          {message}
        </p>
      )}
    </Modal>
  );
};

export default ConfirmModal;
