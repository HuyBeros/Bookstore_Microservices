import { initialBooks } from './books';

const TRANSACTION_TYPES = ['IMPORT', 'EXPORT_ORDER', 'ADJUSTMENT'];

export const initialInventoryTransactions = Array.from({ length: 40 }, (_, idx) => {
  const book = initialBooks[idx % initialBooks.length];
  const type = TRANSACTION_TYPES[idx % TRANSACTION_TYPES.length];
  const quantity = type === 'IMPORT' ? (idx % 5 + 1) * 20 : (type === 'EXPORT_ORDER' ? -((idx % 4) + 1) : ((idx % 2 === 0 ? 5 : -3)));
  const daysAgo = Math.floor(idx * 1.5);

  return {
    id: idx + 1,
    book_id: book.id,
    book_title: book.title,
    type,
    quantity,
    note: type === 'IMPORT' ? 'Nhập kho đợt mới từ NXB' : type === 'EXPORT_ORDER' ? `Xuất đơn hàng #${1001 + idx}` : 'Kiểm kê định kỳ tháng',
    created_by: idx % 2 === 0 ? 'Trần Thị Thu Hà (staff1)' : 'Lê Văn Hoàng (staff2)',
    created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  };
});

