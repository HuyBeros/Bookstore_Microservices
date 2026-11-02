import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from '../../api/services/authorApi';
import CrudTable from '../../components/features/CrudTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { PageHeader } from '../../components/ui';

const authorSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  bio: z.string().optional(),
});

const AuthorManagePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';

  const { data: authorsData, loading, refetch } = useFetch(
    async () => {
      const res = await getAuthors({ q: search, page, limit: 10 });
      return res;
    },
    [page, search]
  );

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(authorSchema),
    defaultValues: editingItem || {},
  });

  const handleAdd = () => {
    setEditingItem(null);
    reset({ name: '', bio: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset({ name: item.name, bio: item.bio || item.biography || '' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingItem) {
        await updateAuthor(editingItem.id, data);
        showToast({ type: 'success', message: 'Cập nhật tác giả thành công' });
      } else {
        await createAuthor(data);
        showToast({ type: 'success', message: 'Thêm mới tác giả thành công' });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err?.message || 'Không thể lưu tác giả' });
    }
  };

  const columns = [
    { key: 'name', header: 'Tác giả', width: '220px' },
    {
      key: 'bookCount',
      header: 'Số sách',
      width: '120px',
      render: (value, row) => {
        const count = row.bookCount ?? row.book_count ?? (row.books ? row.books.length : 1);
        return (
          <span className="font-medium text-body-sm text-ink dark:text-ink">
            {count} cuốn
          </span>
        );
      },
    },
    {
      key: 'bio',
      header: 'Tiểu sử / Giới thiệu',
      render: (value, row) => {
        const text = value || row.biography;
        return text ? (
          <span className="text-body-sm text-ink-muted line-clamp-2">
            {text}
          </span>
        ) : '-';
      },
    },
  ];

  // Map author rows to include bookCount flag for delete safety
  const rawList = authorsData?.data || authorsData?.content || [];
  const processedData = rawList.map((item) => ({
    ...item,
    bookCount: item.bookCount ?? item.book_count ?? 1, // Most catalog authors have linked books
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Quản lý tác giả"
        subtitle="Danh mục các tác giả và ngòi bút văn học của nhà sách"
      />

      <CrudTable
        data={processedData}
        columns={columns}
        loading={loading}
        page={page}
        totalPages={authorsData?.totalPages || 1}
        onPageChange={(p) => setSearchParams({ page: p.toString(), q: search })}
        onSearch={(q) => setSearchParams({ q, page: '1' })}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) =>
          deleteAuthor(id)
            .then(refetch)
            .catch((err) => showToast({ type: 'error', message: err?.message }))
        }
        searchPlaceholder="Tìm kiếm theo tên tác giả..."
        addButtonLabel="Thêm tác giả"
      />

      {isModalOpen && (
        <Modal
          title={editingItem ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Họ tên tác giả" required error={errors.name?.message}>
              <input
                {...register('name')}
                type="text"
                placeholder="Nhập họ tên tác giả"
                className="w-full px-4 py-2 border border-border bg-surface text-ink rounded-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>

            <FormField label="Tiểu sử / Thông tin giới thiệu">
              <textarea
                {...register('bio')}
                placeholder="Tiểu sử tóm tắt về tác giả"
                rows={3}
                className="w-full px-4 py-2 border border-border bg-surface text-ink rounded-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                {editingItem ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AuthorManagePage;
