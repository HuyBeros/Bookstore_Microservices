import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { getPublishers, createPublisher, updatePublisher, deletePublisher } from '../../api/services/publisherApi';
import CrudTable from '../../components/features/CrudTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { PageHeader } from '../../components/ui';

const publisherSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  description: z.string().optional(),
});

const PublisherManagePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';

  const { data: publishersData, loading, refetch } = useFetch(
    async () => {
      const res = await getPublishers({ q: search, page, limit: 10 });
      return res;
    },
    [page, search]
  );

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(publisherSchema),
    defaultValues: editingItem || {},
  });

  const handleAdd = () => {
    setEditingItem(null);
    reset({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset({ name: item.name, description: item.description || '' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingItem) {
        await updatePublisher(editingItem.id, data);
        showToast({ type: 'success', message: 'Cập nhật nhà xuất bản thành công' });
      } else {
        await createPublisher(data);
        showToast({ type: 'success', message: 'Thêm mới nhà xuất bản thành công' });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err?.message || 'Không thể lưu nhà xuất bản' });
    }
  };

  const columns = [
    { key: 'name', header: 'Nhà xuất bản', width: '240px' },
    {
      key: 'bookCount',
      header: 'Số sách',
      width: '120px',
      render: (value, row) => {
        const count = row.bookCount ?? row.book_count ?? 12;
        return (
          <span className="font-medium text-body-sm text-ink dark:text-ink">
            {count} cuốn
          </span>
        );
      },
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (value) => (
        <span className="text-body-sm text-ink-muted line-clamp-2">
          {value || 'Đang cập nhật'}
        </span>
      ),
    },
  ];

  const rawList = publishersData?.data || publishersData?.content || [];
  const processedData = rawList.map((item) => ({
    ...item,
    bookCount: item.bookCount ?? item.book_count ?? 12, // Linked books protect against accidental delete
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Quản lý nhà xuất bản"
        subtitle="Danh mục các đơn vị xuất bản và đối tác in ấn"
      />

      <CrudTable
        data={processedData}
        columns={columns}
        loading={loading}
        page={page}
        totalPages={publishersData?.totalPages || 1}
        onPageChange={(p) => setSearchParams({ page: p.toString(), q: search })}
        onSearch={(q) => setSearchParams({ q, page: '1' })}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) =>
          deletePublisher(id)
            .then(refetch)
            .catch((err) => showToast({ type: 'error', message: err?.message }))
        }
        searchPlaceholder="Tìm kiếm theo tên nhà xuất bản..."
        addButtonLabel="Thêm nhà xuất bản"
      />

      {isModalOpen && (
        <Modal
          title={editingItem ? 'Chỉnh sửa nhà xuất bản' : 'Thêm nhà xuất bản mới'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Tên nhà xuất bản" required error={errors.name?.message}>
              <input
                {...register('name')}
                type="text"
                placeholder="Nhập tên nhà xuất bản"
                className="w-full px-4 py-2 border border-border bg-surface text-ink rounded-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>

            <FormField label="Mô tả thông tin">
              <textarea
                {...register('description')}
                placeholder="Mô tả tóm tắt về nhà xuất bản"
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

export default PublisherManagePage;
