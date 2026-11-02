/**
 * Order Service - Manages Cart, Orders, and Payments
 * Base URL: http://localhost:8082/api
 */

import { API_CONFIG, createHeaders, getUserId } from '../apiConfig';
import {
  CartResponse,
  CartItemRequest,
  OrderResponse,
  PlaceOrderRequest,
  PaymentResponse,
  PaymentRequest,
  ApiResponse,
} from '../../types/api.types';

class OrderService {
  private baseUrl = API_CONFIG.ORDER_SERVICE.BASE_URL;

  // ========== CART ENDPOINTS ==========

  /**
   * Get user's cart
   * GET /cart?userId={userId}
   */
  async getCart(): Promise<CartResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/cart?userId=${userId}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    return response.json();
  }

  /**
   * Add item to cart
   * POST /cart/items?userId={userId}
   */
  async addToCart(data: CartItemRequest): Promise<CartResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/cart/items?userId=${userId}`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add item to cart');
    }

    return response.json();
  }

  /**
   * Update cart item quantity
   * PUT /cart/items/{bookId}?userId={userId}
   */
  async updateCartQuantity(bookId: number, quantity: number): Promise<CartResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/cart/items/${bookId}?userId=${userId}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update cart');
    }

    return response.json();
  }

  /**
   * Remove item from cart
   * DELETE /cart/items/{bookId}?userId={userId}
   */
  async removeFromCart(bookId: number): Promise<CartResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/cart/items/${bookId}?userId=${userId}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to remove item from cart');
    }

    return response.json();
  }

  /**
   * Clear entire cart
   * DELETE /cart?userId={userId}
   */
  async clearCart(): Promise<void> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/cart?userId=${userId}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }
  }

  // ========== ORDER ENDPOINTS ==========

  /**
   * Place new order
   * POST /orders?userId={userId}
   */
  async placeOrder(data: PlaceOrderRequest): Promise<OrderResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/orders?userId=${userId}`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to place order');
    }

    const result: ApiResponse<OrderResponse> = await response.json();
    return result.data;
  }

  /**
   * Get my orders
   * GET /orders/my?userId={userId}
   */
  async getMyOrders(): Promise<OrderResponse[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/orders/my?userId=${userId}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  /**
   * Get order details
   * GET /orders/{id}
   */
  async getOrder(orderId: number): Promise<OrderResponse> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`Order not found: ${orderId}`);
    }

    return response.json();
  }

  /**
   * Cancel order
   * POST /orders/{id}/cancel?userId={userId}
   */
  async cancelOrder(orderId: number): Promise<OrderResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel?userId=${userId}`, {
      method: 'POST',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel order');
    }

    return response.json();
  }

  /**
   * Get order status history
   * GET /orders/{id}/status-history
   */
  async getOrderStatusHistory(orderId: number): Promise<Array<{
    status: string;
    changedAt: string;
    changedBy?: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/status-history`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order status history');
    }

    return response.json();
  }

  // ========== PAYMENT ENDPOINTS ==========

  /**
   * Create payment for order
   * POST /orders/{id}/payments?userId={userId}
   */
  async createPayment(orderId: number, data: PaymentRequest): Promise<PaymentResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/orders/${orderId}/payments?userId=${userId}`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment');
    }

    return response.json();
  }

  /**
   * Get payment details
   * GET /payments/{id}
   */
  async getPayment(paymentId: number): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    return response.json();
  }

  /**
   * Get payment history for order
   * GET /orders/{id}/payments
   */
  async getPaymentHistory(orderId: number): Promise<PaymentResponse[]> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return response.json();
  }

  /**
   * Verify payment
   * POST /payments/{id}/verify
   */
  async verifyPayment(paymentId: number, data?: any): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: createHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment verification failed');
    }

    return response.json();
  }

  /**
   * Get payment info (for COD instruction)
   * GET /orders/{id}/payment-info
   */
  async getPaymentInfo(orderId: number): Promise<{
    method: string;
    instruction: string;
    bankInfo?: any;
  }> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/payment-info`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment info');
    }

    return response.json();
  }
}

export const orderService = new OrderService();
export default orderService;
