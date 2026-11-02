/**
 * Inventory Service - Manages Book Stock and Inventory Transactions
 * Base URL: http://localhost:8084/api/inventory
 */

import { API_CONFIG, createHeaders } from '../apiConfig';
import {
  InventoryResponse,
  InventoryTransactionResponse,
  ImportInventoryRequest,
  AdjustInventoryRequest,
  DeductInventoryRequest,
  RestoreInventoryRequest,
} from '../../types/api.types';

class InventoryService {
  private baseUrl = API_CONFIG.INVENTORY_SERVICE.BASE_URL;

  // ========== INVENTORY ENDPOINTS ==========

  /**
   * Get all inventory records
   * GET /
   */
  async getAllInventory(): Promise<InventoryResponse[]> {
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    return response.json();
  }

  /**
   * Get inventory for specific book
   * GET /{bookId}
   */
  async getInventory(bookId: number): Promise<InventoryResponse> {
    const response = await fetch(`${this.baseUrl}/${bookId}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`Inventory not found for book: ${bookId}`);
    }

    return response.json();
  }

  /**
   * Get batch inventory for multiple books
   * GET /batch?ids=1,2,3
   */
  async getBatchInventory(bookIds: number[]): Promise<InventoryResponse[]> {
    const idsParam = bookIds.join(',');
    const response = await fetch(`${this.baseUrl}/batch?ids=${idsParam}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch inventory');
    }

    return response.json();
  }

  /**
   * Get low stock items (stock below threshold)
   * GET /low-stock?threshold=5
   */
  async getLowStockItems(threshold: number = 5): Promise<InventoryResponse[]> {
    const response = await fetch(`${this.baseUrl}/low-stock?threshold=${threshold}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch low stock items');
    }

    return response.json();
  }

  /**
   * Get out of stock items (quantity = 0)
   * GET /out-of-stock
   */
  async getOutOfStockItems(): Promise<InventoryResponse[]> {
    const response = await fetch(`${this.baseUrl}/out-of-stock`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch out of stock items');
    }

    return response.json();
  }

  /**
   * Check if book is in stock
   * GET /{bookId}/in-stock
   */
  async isInStock(bookId: number, quantity: number = 1): Promise<boolean> {
    try {
      const inventory = await this.getInventory(bookId);
      return inventory.quantity >= quantity;
    } catch {
      return false;
    }
  }

  // ========== TRANSACTION ENDPOINTS ==========

  /**
   * Get inventory transactions
   * GET /transactions?bookId=1
   */
  async getTransactions(
    bookId?: number,
    type?: string,
    limit: number = 50
  ): Promise<InventoryTransactionResponse[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (bookId) params.append('bookId', bookId.toString());
    if (type) params.append('type', type);

    const response = await fetch(`${this.baseUrl}/transactions?${params}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return response.json();
  }

  /**
   * Get transaction by ID
   * GET /transactions/{id}
   */
  async getTransaction(id: number): Promise<InventoryTransactionResponse> {
    const response = await fetch(`${this.baseUrl}/transactions/${id}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error(`Transaction not found: ${id}`);
    }

    return response.json();
  }

  // ========== IMPORT/ADJUSTMENT ENDPOINTS ==========

  /**
   * Import inventory (staff/admin only)
   * POST /import
   */
  async importInventory(data: ImportInventoryRequest): Promise<InventoryResponse> {
    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import inventory');
    }

    return response.json();
  }

  /**
   * Import multiple items at once
   * POST /batch-import
   */
  async batchImportInventory(
    items: ImportInventoryRequest[]
  ): Promise<InventoryResponse[]> {
    const response = await fetch(`${this.baseUrl}/batch-import`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to batch import inventory');
    }

    return response.json();
  }

  /**
   * Adjust inventory (staff/admin only)
   * POST /adjust
   */
  async adjustInventory(data: AdjustInventoryRequest): Promise<InventoryResponse> {
    const response = await fetch(`${this.baseUrl}/adjust`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to adjust inventory');
    }

    return response.json();
  }

  // ========== ORDER-RELATED ENDPOINTS ==========

  /**
   * Deduct inventory when order is placed
   * POST /orders/{orderId}/deduct
   */
  async deductInventory(orderId: number, data: DeductInventoryRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/deduct`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deduct inventory');
    }
  }

  /**
   * Restore inventory when order is cancelled
   * POST /orders/{orderId}/restore
   */
  async restoreInventory(orderId: number, data: RestoreInventoryRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/restore`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to restore inventory');
    }
  }

  /**
   * Get transaction history for specific order
   * GET /orders/{orderId}/transactions
   */
  async getOrderTransactions(orderId: number): Promise<InventoryTransactionResponse[]> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/transactions`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order transactions');
    }

    return response.json();
  }

  // ========== ANALYTICS ENDPOINTS ==========

  /**
   * Get inventory statistics
   * GET /stats
   */
  async getInventoryStats(): Promise<{
    totalItems: number;
    totalQuantity: number;
    outOfStockCount: number;
    lowStockCount: number;
  }> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory statistics');
    }

    return response.json();
  }

  /**
   * Get most imported books
   * GET /analytics/most-imported
   */
  async getMostImportedBooks(limit: number = 10): Promise<
    Array<{
      bookId: number;
      title: string;
      totalImported: number;
    }>
  > {
    const response = await fetch(`${this.baseUrl}/analytics/most-imported?limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch most imported books');
    }

    return response.json();
  }

  /**
   * Get fast-moving inventory (most sold)
   * GET /analytics/fast-moving
   */
  async getFastMovingBooks(limit: number = 10): Promise<
    Array<{
      bookId: number;
      title: string;
      totalSold: number;
      currentStock: number;
    }>
  > {
    const response = await fetch(`${this.baseUrl}/analytics/fast-moving?limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch fast-moving books');
    }

    return response.json();
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
