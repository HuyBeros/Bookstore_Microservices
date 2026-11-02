import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Select,
  Textarea,
  Spinner,
  Skeleton,
  BookCardSkeleton,
  Toast,
  Pagination,
  FormField,
  QuantityInput,
  DataTable,
  SearchInput,
  StatusBadge,
  ConfirmModal,
  PageHeader,
  ChartCard,
  BookCard,
  EmptyState,
  ErrorState,
  ErrorBoundary,
} from '../../components/ui';

/**
 * ComponentsDemo Page
 * Development-only showcase of all UI components
 * Only visible in development mode
 */
const ComponentsDemo = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [quantity, setQuantity] = useState(1);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const mockBooks = [
    {
      id: 1,
      title: 'Tôi Là Bố',
      price: 120000,
      imageUrl: '',
      stockQuantity: 10,
      authors: [{ authorName: 'Rosalind Wiseman' }],
    },
    {
      id: 2,
      title: 'Sapiens: A Brief History of Humankind',
      price: 150000,
      imageUrl: '',
      stockQuantity: 0,
      authors: [{ authorName: 'Yuval Noah Harari' }],
    },
  ];

  const tableData = [
    { id: 1, name: 'Sách 1', author: 'Tác giả 1', price: 120000 },
    { id: 2, name: 'Sách 2', author: 'Tác giả 2', price: 150000 },
    { id: 3, name: 'Sách 3', author: 'Tác giả 3', price: 200000 },
  ];

  const tableColumns = [
    { header: 'Tên', accessor: 'name' },
    { header: 'Tác giả', accessor: 'author' },
    {
      header: 'Giá',
      accessor: 'price',
      render: (row) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(row.price),
    },
  ];

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-6 text-center">
        <p className="text-danger">Trang này chỉ có sẵn ở chế độ development</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-paper p-6">
      <PageHeader
        title="UI Components Demo"
        subtitle="Showcase of all reusable UI components"
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Components Demo' },
        ]}
      />

      <div className="space-y-12 max-w-5xl">
        {/* Buttons */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Buttons</h2>
          <Card className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Inputs</h2>
          <Card className="p-6 space-y-4">
            <FormField label="Text Input" required>
              <Input placeholder="Enter text..." />
            </FormField>
            <FormField label="Password" required error="Mật khẩu không khớp">
              <Input type="password" placeholder="Enter password..." />
            </FormField>
            <FormField label="Email">
              <Input type="email" placeholder="Enter email..." />
            </FormField>
            <FormField label="Select">
              <Select
                options={[
                  { value: 'cat1', label: 'Category 1' },
                  { value: 'cat2', label: 'Category 2' },
                ]}
              />
            </FormField>
            <FormField label="Textarea">
              <Textarea placeholder="Enter message..." />
            </FormField>
            <FormField label="Search">
              <SearchInput placeholder="Search..." />
            </FormField>
          </Card>
        </section>

        {/* Badges & Status */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Badges & Status</h2>
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge type="order" value="PENDING" />
              <StatusBadge type="order" value="CONFIRMED" />
              <StatusBadge type="order" value="DELIVERED" />
              <StatusBadge type="payment" value="PAID" />
              <StatusBadge type="user" value="ACTIVE" />
            </div>
          </Card>
        </section>

        {/* Quantity Input */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Quantity Input</h2>
          <Card className="p-6">
            <div className="w-fit">
              <QuantityInput value={quantity} onChange={setQuantity} max={10} />
            </div>
          </Card>
        </section>

        {/* Modals */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Modals</h2>
          <Card className="p-6 space-y-3">
            <Button onClick={() => setModalOpen(true)} variant="primary">
              Open Modal
            </Button>
            <Button onClick={() => setConfirmOpen(true)} variant="danger">
              Open Confirm Modal
            </Button>
            <Button onClick={() => showToast('success', 'Success notification')} variant="primary">
              Show Success Toast
            </Button>
            <Button onClick={() => showToast('error', 'Error notification')} variant="danger">
              Show Error Toast
            </Button>
          </Card>

          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Sample Modal">
            <p className="text-body-md text-ink dark:text-ink mb-4">
              This is a sample modal. Click the X button or click outside to close.
            </p>
          </Modal>

          <ConfirmModal
            isOpen={confirmOpen}
            title="Delete Item?"
            message="Are you sure you want to delete this item? This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            onConfirm={() => {
              setConfirmOpen(false);
              showToast('info', 'Item deleted');
            }}
            onCancel={() => setConfirmOpen(false)}
          />
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Loading States</h2>
          <Card className="p-6 space-y-4">
            <div>
              <h4 className="text-body-sm font-semibold mb-2">Spinner</h4>
              <div className="flex gap-3">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </div>
            <div>
              <h4 className="text-body-sm font-semibold mb-2">Skeleton</h4>
              <Skeleton count={3} />
            </div>
            <div>
              <h4 className="text-body-sm font-semibold mb-2">Book Card Skeleton</h4>
              <BookCardSkeleton />
            </div>
          </Card>
        </section>

        {/* Data Table */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Data Table</h2>
          <Card className="p-6">
            <DataTable columns={tableColumns} data={tableData} />
          </Card>
        </section>

        {/* Pagination */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Pagination</h2>
          <Card className="p-6">
            <Pagination page={page} totalPages={20} onChange={setPage} />
          </Card>
        </section>

        {/* Book Cards */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Book Cards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                href={`/books/${book.id}`}
                onAddToCart={() => showToast('success', 'Added to cart')}
              />
            ))}
          </div>
        </section>

        {/* Empty & Error States */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">States</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-body-sm font-semibold mb-4">Empty State</h4>
              <EmptyState
                title="No data"
                description="There is no data to display"
                actionLabel="Create New"
              />
            </Card>
            <Card className="p-6">
              <h4 className="text-body-sm font-semibold mb-4">Error State</h4>
              <ErrorState
                title="Load Failed"
                message="Failed to load data"
                retryLabel="Retry"
                onRetry={() => showToast('info', 'Retrying...')}
              />
            </Card>
          </div>
        </section>

        {/* Error Boundary */}
        <section>
          <h2 className="text-heading-lg font-semibold text-ink dark:text-ink mb-4">Error Boundary</h2>
          <Card className="p-6">
            <ErrorBoundary>
              <p>This component is wrapped in an error boundary.</p>
            </ErrorBoundary>
          </Card>
        </section>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default ComponentsDemo;
