export const mapUser = (user) => user && ({
  ...user,
  id: user.userId ?? user.id,
  user_id: user.userId ?? user.user_id ?? user.id,
  full_name: user.fullName ?? user.full_name,
  created_at: user.createdAt ?? user.created_at,
});

export const mapCart = (cart = {}) => ({
  ...cart,
  items: (cart.items ?? cart.data?.items ?? []).map((item) => {
    const cover = item.coverUrl ?? item.cover_url ?? item.imageUrl ?? item.image_url ?? item.image ?? item.cover;
    return {
      ...item,
      book_id: item.bookId ?? item.book_id,
      title: item.title ?? item.bookTitle ?? item.book_title,
      cover_url: cover,
      coverUrl: cover,
      image_url: cover,
      imageUrl: cover,
      price: Number(item.unitPrice ?? item.price ?? item.unit_price ?? 0),
      unit_price: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0),
    };
  }),
});

export const mapOrder = (order) => order && ({
  ...order,
  id: String(order.orderId ?? order.id),
  user_id: order.userId ?? order.user_id,
  status: order.orderStatus ?? order.status,
  shipping_address: order.shippingAddress ?? order.shipping_address,
  shipping_cost: Number(order.shippingCost ?? order.shipping_cost ?? 0),
  customer_name: order.customerName ?? order.customer_name,
  customer_phone: order.customerPhone ?? order.customer_phone,
  total_amount: Number(order.totalAmount ?? order.total_amount ?? 0),
  subtotal: Number(order.totalAmount ?? order.total_amount ?? 0) - Number(order.shippingCost ?? order.shipping_cost ?? 0),
  payment_method: order.paymentMethod ?? order.payment_method,
  payment_status: order.paymentStatus ?? order.payment_status,
  created_at: order.createdAt ?? order.created_at,
  items: (order.items ?? []).map((item) => {
    const cover = item.coverUrl ?? item.cover_url ?? item.imageUrl ?? item.image_url ?? item.image ?? item.cover;
    return {
      ...item,
      id: item.bookId ?? item.book_id,
      book_id: item.bookId ?? item.book_id,
      title: item.bookTitle ?? item.title,
      cover_url: cover,
      coverUrl: cover,
      image_url: cover,
      imageUrl: cover,
      unit_price: Number(item.unitPrice ?? item.unit_price ?? 0),
      subtotal: Number(item.lineTotal ?? item.subtotal ?? (Number(item.unitPrice ?? item.unit_price ?? 0) * item.quantity)),
    };
  }),
});
