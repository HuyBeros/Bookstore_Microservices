import { initialBooks } from './books';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const PAYMENTS = ['COD', 'BANK_TRANSFER', 'MOMO'];

export const initialOrders = Array.from({ length: 30 }, (_, index) => {
  const id = 1001 + index;
  const status = STATUSES[index % STATUSES.length];
  const paymentMethod = PAYMENTS[index % PAYMENTS.length];
  const isDelivered = status === 'DELIVERED';
  const paymentStatus = isDelivered ? 'PAID' : (paymentMethod === 'COD' ? 'UNPAID' : (index % 2 === 0 ? 'PAID' : 'PENDING'));

  // Chọn 1-3 sách
  const book1 = initialBooks[index % initialBooks.length];
  const book2 = initialBooks[(index + 3) % initialBooks.length];
  const items = [
    {
      id: index * 2 + 1,
      book_id: book1.id,
      title: book1.title,
      unit_price: book1.price,
      quantity: (index % 3) + 1,
      image: book1.image,
    },
  ];
  if (index % 2 === 0) {
    items.push({
      id: index * 2 + 2,
      book_id: book2.id,
      title: book2.title,
      unit_price: book2.price,
      quantity: 1,
      image: book2.image,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalAmount = subtotal;

  const daysAgo = Math.floor(index * 2);
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

  // Đơn thuộc về customer1 (id: 4) hoặc khách khác
  const isCustomer1 = index % 3 === 0 || index < 5;
  const userId = isCustomer1 ? 4 : 5;
  const customerName = isCustomer1 ? 'Nguyễn Văn An' : `Khách Hàng ${index + 1}`;
  const customerPhone = isCustomer1 ? '0912345678' : `0987000${String(index).padStart(3, '0')}`;
  const customerEmail = isCustomer1 ? 'customer1@gmail.com' : `khachhang${index + 1}@gmail.com`;

  const statusHistory = [
    {
      status: 'PENDING',
      changed_at: createdAt,
      notes: 'Đơn hàng được khởi tạo thành công qua website',
    },
  ];

  if (['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(status)) {
    statusHistory.push({
      status: 'CONFIRMED',
      changed_at: new Date(new Date(createdAt).getTime() + 1800000).toISOString(),
      notes: 'Phương Anh Bookstore đã tiếp nhận và xác nhận đơn',
    });
  }

  if (['PREPARING', 'SHIPPING', 'DELIVERED'].includes(status)) {
    statusHistory.push({
      status: 'PREPARING',
      changed_at: new Date(new Date(createdAt).getTime() + 3600000).toISOString(),
      notes: 'Đóng gói bọc chống sốc sách cẩn thận',
    });
  }

  if (['SHIPPING', 'DELIVERED'].includes(status)) {
    statusHistory.push({
      status: 'SHIPPING',
      changed_at: new Date(new Date(createdAt).getTime() + 7200000).toISOString(),
      notes: 'Bàn giao cho đơn vị vận chuyển hỏa tốc',
    });
  }

  if (status === 'DELIVERED') {
    statusHistory.push({
      status: 'DELIVERED',
      changed_at: new Date(new Date(createdAt).getTime() + 86400000).toISOString(),
      notes: 'Giao hàng thành công đến tay người nhận',
    });
  }

  if (status === 'CANCELLED') {
    statusHistory.push({
      status: 'CANCELLED',
      changed_at: new Date(new Date(createdAt).getTime() + 1200000).toISOString(),
      notes: 'Khách hàng yêu cầu hủy đơn qua hệ thống',
    });
  }

  return {
    id,
    order_id: id,
    user_id: userId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    shipping_address: isCustomer1 ? 'Số 88 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội' : `Số ${index * 3 + 1} Đường Giải Phóng, Hà Nội`,
    subtotal,
    total_amount: totalAmount,
    total: totalAmount,
    status,
    order_status: status,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    notes: index % 4 === 0 ? 'Giao giờ hành chính giúp em ạ' : '',
    items,
    status_history: statusHistory,
    created_at: createdAt,
  };
});

