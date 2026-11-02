import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';

/**
 * CrudTable: Generic bảng CRUD cho các entity (categories, authors, publishers)
 * Cung cấp: thêm, sửa, xóa, tìm kiếm, phân trang
 */
const CrudTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  page = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  onRetry,
  searchPlaceholder = 'Tìm kiếm...',
  addButtonLabel = 'Thêm mới',
  emptyText = 'Không có dữ liệu',
  deleteConfirmTitle = 'Xác nhận xóa',
  deleteConfirmMessage = 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleDeleteClick = (item) => {
    const hasLinkedBooks = (item.bookCount > 0) || (item.book_count > 0) || (item.books_count > 0);
    if (hasLinkedBooks) return;
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(deleteTarget.id);
      }
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const actionColumns = [
    ...columns,
    {
      key: 'actions',
      header: 'Thao tác',
      width: '120px',
      render: (_, row) => {
        const hasLinkedBooks = (row.bookCount > 0) || (row.book_count > 0) || (row.books_count > 0);

        return (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onEdit && onEdit(row)}
              className="p-1.5 text-ink-muted hover:text-primary hover:bg-surface-muted rounded transition-colors"
              title="Chỉnh sửa"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(row)}
              disabled={hasLinkedBooks}
              className={`p-1.5 rounded transition-colors ${
                hasLinkedBooks
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                  : 'text-ink-muted hover:text-danger hover:bg-danger-soft'
              }`}
              title={hasLinkedBooks ? 'Quy tắc an toàn: Không thể xóa vì còn sách liên kết' : 'Xóa mục này'}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Header with search and add button */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-border bg-surface text-ink rounded-input focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onAdd}
          icon={<Plus size={18} />}
          className="flex-shrink-0"
        >
          {addButtonLabel}
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={actionColumns}
        data={data}
        loading={loading}
        error={error}
        emptyText={emptyText}
        onRetry={onRetry}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmModal
          title={deleteConfirmTitle}
          message={deleteConfirmMessage}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
          confirmText="Xóa vĩnh viễn"
          cancelText="Hủy"
          confirmVariant="danger"
        />
      )}
    </>
  );
};

export default CrudTable;
