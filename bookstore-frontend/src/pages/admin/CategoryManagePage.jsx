import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Modal,
  FormField,
  Input,
  Textarea,
  ConfirmModal,
  PageHeader,
} from '../../components/ui';
import { categoryApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';

/**
 * CategoryManagePage Component
 * Manage book categories: list, create, edit, delete
 */
const CategoryManagePage = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoryApi.getCategories?.();
        setCategories(Array.isArray(data) ? data : data?.data || []);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải thể loại:', err);
        setError('Không thể tải danh mục thể loại');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleOpenForm = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'Vui lòng nhập tên thể loại');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await categoryApi.updateCategory(editingId, formData);
        setCategories(
          categories.map((c) => (c.id === editingId ? { ...c, ...formData } : c))
        );
        showToast('success', 'Đã cập nhật thể loại thành công');
      } else {
        const newCategory = await categoryApi.createCategory(formData);
        setCategories([...categories, newCategory]);
        showToast('success', 'Đã thêm thể loại mới thành công');
      }

      setFormOpen(false);
      setFormData({ name: '', description: '' });
    } catch (err) {
      showToast('error', err.message || 'Không thể lưu thể loại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      await categoryApi.deleteCategory(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));
      showToast('success', 'Đã xóa thể loại thành công');
      setDeleteConfirm(null);
    } catch (err) {
      showToast('error', err.message || 'Không thể xóa thể loại');
    }
  };

  const columns = [
    {
      header: 'Tên thể loại',
      accessor: 'name',
      render: (row) => (
        <p className="font-semibold text-body-sm text-ink dark:text-ink">
          {row.name}
        </p>
      ),
    },
    {
      header: 'Số sách',
      accessor: 'book_count',
      render: (row) => (
        <span className="font-medium text-body-sm text-ink dark:text-ink">
          {row.book_count ?? 30} cuốn
        </span>
      ),
    },
    {
      header: 'Mô tả thể loại',
      accessor: 'description',
      render: (row) => (
        <p className="text-body-sm text-ink-muted dark:text-ink-muted line-clamp-2">
          {row.description || 'Chưa có mô tả'}
        </p>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => handleOpenForm(row)}
            className="p-1.5 text-ink-muted hover:text-primary hover:bg-surface-muted rounded-button transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirm(row.id)}
            className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger-soft rounded-button transition-colors"
            title="Xóa thể loại"
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
        title="Thể loại sách"
        subtitle="Danh mục phân loại các thể loại tác phẩm văn học và tri thức"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => handleOpenForm()}
          >
            Thêm thể loại
          </Button>
        }
      />

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : categories.length === 0 && !loading ? (
        <EmptyState
          title="Chưa có thể loại sách nào"
          description="Bắt đầu bằng cách thêm thể loại sách đầu tiên"
          action={() => handleOpenForm()}
          actionLabel="Thêm thể loại"
        />
      ) : (
        <DataTable columns={columns} data={categories} loading={loading} />
      )}

      {/* Form Modal */}
      {formOpen && (
        <Modal
          title={editingId ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
          onClose={() => setFormOpen(false)}
        >
          <div className="space-y-4">
            <FormField label="Tên thể loại" required>
              <Input
                placeholder="Ví dụ: Văn học cổ điển, Triết học..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </FormField>

            <FormField label="Mô tả thể loại">
              <Textarea
                placeholder="Mô tả tóm tắt về thể loại sách này"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="secondary" onClick={() => setFormOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={!formData.name.trim()}
              >
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Xác nhận xóa thể loại?"
        message="Hành động này không thể hoàn tác. Các sách thuộc thể loại này sẽ cần được phân loại lại."
        confirmLabel="Xóa thể loại"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default CategoryManagePage;
