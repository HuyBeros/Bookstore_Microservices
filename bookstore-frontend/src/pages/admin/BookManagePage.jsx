import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Button,
  DataTable,
  SearchInput,
  Select,
  EmptyState,
  ErrorState,
  ConfirmModal,
  PageHeader,
} from '../../components/ui';
import { bookApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/formatters';

/**
 * BookManagePage Component
 * Manage books: list, search, filter, edit, delete
 */
const BookManagePage = () => {
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const params = {
          ...(searchTerm && { search: searchTerm }),
          ...(categoryFilter && { category_id: categoryFilter }),
          limit: 50,
        };
        const data = await bookApi.getBooks(params);
        setBooks(Array.isArray(data) ? data : data?.data || []);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải danh sách sách:', err);
        setError('Không thể tải danh mục sách');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchBooks, 300); // Debounce
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter]);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await bookApi.getCategories?.();
        setCategories(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error('Lỗi khi tải thể loại:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleDelete = async (bookId) => {
    try {
      setDeleting(true);
      await bookApi.deleteBook(bookId);
      setBooks(books.filter((b) => b.id !== bookId));
      showToast('success', 'Đã xóa sách thành công');
      setDeleteConfirm(null);
    } catch (err) {
      showToast('error', err.message || 'Không thể xóa sách');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Tác phẩm',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3 max-w-sm">
          {(row.coverUrl || row.cover_url || row.image) && (
            <img
              src={row.coverUrl || row.cover_url || row.image}
              alt={row.title}
              className="w-9 h-12 object-cover rounded shadow-2xs border border-border flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-body-sm text-ink dark:text-ink line-clamp-2" title={row.title}>
              {row.title}
            </p>
            {row.isbn && (
              <p className="text-caption text-ink-muted">ISBN: {row.isbn}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Tác giả',
      accessor: 'authors',
      render: (row) => (
        <p className="text-body-sm text-ink-muted dark:text-ink-muted line-clamp-1">
          {row.authors?.map((a) => a.name).join(', ') || row.author || '-'}
        </p>
      ),
    },
    {
      header: 'Thể loại',
      accessor: 'category',
      render: (row) => (
        <span className="inline-flex px-2 py-0.5 rounded-badge text-caption font-medium bg-surface-muted dark:bg-surface text-ink-muted">
          {row.category?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Giá bán',
      accessor: 'price',
      render: (row) => (
        <p className="text-body-sm font-semibold text-ink dark:text-ink">
          {formatPrice(row.price)}
        </p>
      ),
    },
    {
      header: 'Tồn kho',
      accessor: 'stock_quantity',
      render: (row) => {
        const qty = row.stock_quantity ?? row.stock ?? 0;
        if (qty === 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-bold bg-danger-soft text-danger">
              Hết hàng
            </span>
          );
        }
        if (qty <= 5) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-bold bg-warning-soft text-warning">
              Sắp hết ({qty})
            </span>
          );
        }
        return (
          <span className="text-body-sm font-medium text-ink dark:text-ink">
            {qty} cuốn
          </span>
        );
      },
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => (window.location.href = `/admin/books/${row.id}/edit`)}
            className="p-1.5 text-ink-muted hover:text-primary hover:bg-surface-muted rounded-button transition-colors"
            title="Chỉnh sửa sách"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirm(row.id)}
            className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger-soft rounded-button transition-colors"
            title="Xóa sách"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Quản lý sách"
        subtitle="Danh mục và quản trị các đầu sách trong hệ thống"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => (window.location.href = '/admin/books/new')}
          >
            Thêm sách mới
          </Button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchInput
          placeholder="Tìm kiếm theo tựa sách, tác giả..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <Select
          options={[
            { value: '', label: 'Tất cả thể loại' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : books.length === 0 && !loading ? (
        <EmptyState
          title="Không tìm thấy sách phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc thêm đầu sách mới"
          action={() => (window.location.href = '/admin/books/new')}
          actionLabel="Thêm sách mới"
        />
      ) : (
        <DataTable columns={columns} data={books} loading={loading} />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Xác nhận xóa sách?"
        message="Hành động này sẽ xóa vĩnh viễn sách khỏi danh mục và không thể hoàn tác."
        confirmLabel="Xóa sách"
        cancelLabel="Hủy"
        variant="danger"
        loading={deleting}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default BookManagePage;
