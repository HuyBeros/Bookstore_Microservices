/**
 * Catalog Service - Manages Books, Authors, Categories, Publishers
 * Base URL: http://localhost:8080/api/catalog
 */

import { API_CONFIG, createHeaders } from '../apiConfig';
import {
  BookResponse,
  PageResponse,
  AuthorResponse,
  CategoryResponse,
  PublisherResponse,
} from '../../types/api.types';

class CatalogService {
  private baseUrl = API_CONFIG.CATALOG_SERVICE.BASE_URL;

  // ========== BOOK ENDPOINTS ==========

  /**
   * Search books with filters
   * GET /books?q=java&categoryId=1&authorId=5&page=0&size=20&sort=newest
   */
  async searchBooks(
    query: string = '',
    filters?: {
      categoryId?: number;
      authorId?: number;
      publisherId?: number;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      size?: number;
      sort?: string;
    }
  ): Promise<PageResponse<BookResponse>> {
    const params = new URLSearchParams({
      q: query,
      page: (filters?.page || 0).toString(),
      size: (filters?.size || 20).toString(),
      sort: filters?.sort || 'newest',
    });

    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.authorId) params.append('authorId', filters.authorId.toString());
    if (filters?.publisherId) params.append('publisherId', filters.publisherId.toString());
    if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());

    const response = await fetch(`${this.baseUrl}/books?${params}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to search books: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all books
   * GET /books
   */
  async getAllBooks(page: number = 0, size: number = 20): Promise<PageResponse<BookResponse>> {
    return this.searchBooks('', { page, size });
  }

  /**
   * Get book details by ID
   * GET /books/{id}
   */
  async getBook(id: number): Promise<BookResponse> {
    const response = await fetch(`${this.baseUrl}/books/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Book not found: ${id}`);
    }

    return response.json();
  }

  /**
   * Get multiple books by IDs
   * GET /books/batch?ids=1,2,3
   */
  async getBatchBooks(ids: number[]): Promise<BookResponse[]> {
    const idsParam = ids.join(',');
    const response = await fetch(`${this.baseUrl}/books/batch?ids=${idsParam}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch books');
    }

    return response.json();
  }

  /**
   * Get featured/trending books
   * GET /books/featured
   */
  async getFeaturedBooks(limit: number = 8): Promise<BookResponse[]> {
    const response = await fetch(`${this.baseUrl}/books/featured?limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured books');
    }

    return response.json();
  }

  /**
   * Get best-selling books
   * GET /books/best-selling
   */
  async getBestSellingBooks(limit: number = 8): Promise<BookResponse[]> {
    const response = await fetch(`${this.baseUrl}/books/best-selling?limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch best-selling books');
    }

    return response.json();
  }

  // ========== CATEGORY ENDPOINTS ==========

  /**
   * Get all categories
   * GET /categories
   */
  async getCategories(page: number = 0, size: number = 50): Promise<PageResponse<CategoryResponse>> {
    const response = await fetch(
      `${this.baseUrl}/categories?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  }

  /**
   * Get category by ID
   * GET /categories/{id}
   */
  async getCategory(id: number): Promise<CategoryResponse> {
    const response = await fetch(`${this.baseUrl}/categories/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Category not found: ${id}`);
    }

    return response.json();
  }

  /**
   * Get books by category
   * GET /categories/{id}/books
   */
  async getBooksByCategory(
    categoryId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<BookResponse>> {
    const response = await fetch(
      `${this.baseUrl}/categories/${categoryId}/books?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch books for category: ${categoryId}`);
    }

    return response.json();
  }

  // ========== AUTHOR ENDPOINTS ==========

  /**
   * Get all authors
   * GET /authors
   */
  async getAuthors(page: number = 0, size: number = 50): Promise<PageResponse<AuthorResponse>> {
    const response = await fetch(
      `${this.baseUrl}/authors?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch authors');
    }

    return response.json();
  }

  /**
   * Get author by ID
   * GET /authors/{id}
   */
  async getAuthor(id: number): Promise<AuthorResponse> {
    const response = await fetch(`${this.baseUrl}/authors/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Author not found: ${id}`);
    }

    return response.json();
  }

  /**
   * Get books by author
   * GET /authors/{id}/books
   */
  async getBooksByAuthor(
    authorId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<BookResponse>> {
    const response = await fetch(
      `${this.baseUrl}/authors/${authorId}/books?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch books for author: ${authorId}`);
    }

    return response.json();
  }

  // ========== PUBLISHER ENDPOINTS ==========

  /**
   * Get all publishers
   * GET /publishers
   */
  async getPublishers(page: number = 0, size: number = 50): Promise<PageResponse<PublisherResponse>> {
    const response = await fetch(
      `${this.baseUrl}/publishers?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch publishers');
    }

    return response.json();
  }

  /**
   * Get publisher by ID
   * GET /publishers/{id}
   */
  async getPublisher(id: number): Promise<PublisherResponse> {
    const response = await fetch(`${this.baseUrl}/publishers/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Publisher not found: ${id}`);
    }

    return response.json();
  }

  /**
   * Get books by publisher
   * GET /publishers/{id}/books
   */
  async getBooksByPublisher(
    publisherId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<BookResponse>> {
    const response = await fetch(
      `${this.baseUrl}/publishers/${publisherId}/books?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch books for publisher: ${publisherId}`);
    }

    return response.json();
  }
}

export const catalogService = new CatalogService();
export default catalogService;
