import { useState, useEffect } from 'react';
import {
  Button,
  DataTable,
  SearchInput,
  EmptyState,
  ErrorState,
  Modal,
  FormField,
  Input,
  Card,
  PageHeader,
  Badge,
} from '../../components/ui';
import { bookApi, inventoryApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/formatters';

const LOW_STOCK_THRESHOLD = 5;

/**
 * InventoryPage Component
 * Manage inventory: view stock levels, import goods, filter low stock
 */
const InventoryPage = () => {
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [lowStockBooks, setLowStockBooks] = useState([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState(500);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [importQuantity, setImportQuantity] = useState('');
  const [importing, setImporting] = useState(false);

  // Fetch low stock list once for metric sync
  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const lowStockData = await bookApi.getLowStockBooks({ threshold: LOW_STOCK_THRESHOLD });
        const list = Array.isArray(lowStockData) ? lowStockData : lowStockData?.data || [];
        setLowStockBooks(list);
      } catch (err) {
        console.error('Lỗi khi tải số liệu cảnh báo kho:', err);
      }
    };
    fetchLowStockCount();
  }, []);

  // Fetch books for table
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);

        if (filterLowStock) {
          const lowStockData = await bookApi.getLowStockBooks({ threshold: LOW_STOCK_THRESHOLD });
          const list = Array.isArray(lowStockData) ? lowStockData : lowStockData?.data || [];
          let filtered = list;
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = list.filter((b) => (b.title || '').toLowerCase().includes(term));
          }
          setBooks(filtered);
        } else {
          const params = {
            ...(searchTerm && { search: searchTerm }),
            limit: 50,
          };
          const data = await bookApi.getBooks(params);
          const list = Array.isArray(data) ? data : data?.data || data?.content || [];
          setBooks(list);
          if (data?.totalElements) setTotalCatalogCount(data.totalElements);
        }
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải danh sách kho hàng:', err);
        setError('Không thể tải dữ liệu kho hàng');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterLowStock]);

  const handleImport = async () => {
    if (!selectedBook || !importQuantity || parseInt(importQuantity) <= 0) {
      showToast('error', 'Vui lòng nhập số lượng hợp lệ lớn hơn 0');
      return;
    }

    try {
      setImporting(true);
      const qty = parseInt(importQuantity);
      const updated = await inventoryApi.importStock({
        book_id: selectedBook.id,
        quantity: qty,
        note: 'Nhập kho thủ công',
      });

      const newQty = updated?.quantity ?? ((selectedBook.stock_quantity ?? selectedBook.stock ?? 0) + qty);

      // Update local state
      setBooks(
        books.map((b) =>
          b.id === selectedBook.id
            ? { ...b, stock_quantity: newQty, stock: newQty }
            : b
        )
      );

      // Update lowStock list
      setLowStockBooks((prev) =>
        prev
          .map((b) => (b.id === selectedBook.id ? { ...b, stock_quantity: newQty, stock: newQty } : b))
          .filter((b) => (b.stock_quantity ?? b.stock ?? 0) <= LOW_STOCK_THRESHOLD)
      );

      showToast('success', `Đã nhập thêm ${qty} cuốn cho sách "${selectedBook.title}"`);
      setImportModalOpen(false);
      setImportQuantity('');
      setSelectedBook(null);
    } catch (err) {
      showToast('error', err.message || 'Không thể thực hiện nhập kho');
    } finally {
      setImporting(false);
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
            <p className="font-semibold text-body-sm text-ink dark:text-ink line-clamp-1" title={row.title}>
              {row.title}
            </p>
            <p className="text-caption text-ink-muted">
              {row.category?.name || 'Sách'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Số lượng tồn',
      accessor: 'stock_quantity',
      render: (row) => {
        const qty = row.stock_quantity ?? row.stock ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-body-md text-ink dark:text-ink">
              {qty}
            </span>
            {qty === 0 ? (
              <Badge variant="danger" size="sm">Hết hàng</Badge>
            ) : qty <= LOW_STOCK_THRESHOLD ? (
              <Badge variant="warning" size="sm">Sắp hết</Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      header: 'Đơn giá',
      accessor: 'price',
      render: (row) => (
        <p className="text-body-sm font-semibold text-ink dark:text-ink">
          {formatPrice(row.price)}
        </p>
      ),
    },
    {
      header: 'Tổng giá trị tồn',
      accessor: 'id',
      render: (row) => {
        const qty = row.stock_quantity ?? row.stock ?? 0;
        return (
          <p className="text-body-sm font-semibold text-ink dark:text-ink">
            {formatPrice(row.price * qty)}
          </p>
        );
      },
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedBook(row);
            setImportModalOpen(true);
          }}
        >
          Nhập kho
        </Button>
      ),
    },
  ];

  const outOfStockCount = books.filter((b) => (b.stock_quantity ?? b.stock) === 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Quản lý kho hàng"
        subtitle="Theo dõi số lượng tồn kho và điều phối nhập sách"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 space-y-1.5 shadow-2xs">
          <p className="text-caption font-semibold text-ink-muted uppercase">Tổng đầu sách</p>
          <p className="text-display-sm font-bold text-ink dark:text-ink">
            {totalCatalogCount}
          </p>
        </Card>
        <Card className="p-5 space-y-1.5 shadow-2xs border-warning/20">
          <p className="text-caption font-semibold text-warning uppercase">
            Cảnh báo sắp hết (≤ {LOW_STOCK_THRESHOLD} cuốn)
          </p>
          <p className="text-display-sm font-bold text-warning">
            {lowStockBooks.length}
          </p>
        </Card>
        <Card className="p-5 space-y-1.5 shadow-2xs">
          <p className="text-caption font-semibold text-danger uppercase">Hết hàng (0 cuốn)</p>
          <p className="text-display-sm font-bold text-danger">
            {outOfStockCount}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          placeholder="Tìm kiếm theo tên sách hoặc mã sách..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="flex-1"
        />
        <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-button cursor-pointer hover:bg-surface-muted transition-colors dark:border-border dark:hover:bg-surface select-none">
          <input
            type="checkbox"
            checked={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.checked)}
            className="accent-primary w-4 h-4 rounded"
          />
          <span className="text-body-sm font-medium text-ink dark:text-ink">
            Chỉ xem sách sắp hết ({lowStockBooks.length})
          </span>
        </label>
      </div>

      {/* Inventory Table */}
      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : books.length === 0 && !loading ? (
        <EmptyState
          title="Không có sách nào thỏa mãn điều kiện"
          description="Thử bỏ bộ lọc hoặc tìm kiếm với từ khóa khác"
        />
      ) : (
        <DataTable columns={columns} data={books} loading={loading} />
      )}

      {/* Import Modal */}
      {importModalOpen && selectedBook && (
        <Modal
          title={`Nhập hàng: ${selectedBook.title}`}
          onClose={() => {
            setImportModalOpen(false);
            setSelectedBook(null);
            setImportQuantity('');
          }}
        >
          <div className="space-y-4">
            <div className="p-3 bg-surface-muted rounded-card flex items-center justify-between">
              <div>
                <p className="text-body-sm font-semibold text-ink">{selectedBook.title}</p>
                <p className="text-caption text-ink-muted">Tồn kho hiện tại: {selectedBook.stock_quantity ?? selectedBook.stock ?? 0} cuốn</p>
              </div>
              <p className="text-body-sm font-bold text-ink">{formatPrice(selectedBook.price)}</p>
            </div>

            <FormField label="Số lượng nhập thêm" required>
              <Input
                type="number"
                min="1"
                placeholder="Ví dụ: 20"
                value={importQuantity}
                onChange={(e) => setImportQuantity(e.target.value)}
                autoFocus
              />
            </FormField>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setImportModalOpen(false);
                  setSelectedBook(null);
                  setImportQuantity('');
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                loading={importing}
                disabled={!importQuantity || parseInt(importQuantity) <= 0}
              >
                Xác nhận nhập kho
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;
