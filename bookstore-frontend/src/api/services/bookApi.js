import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
import { catalogFilterParams } from '../bookQuery';

export const mapBook = (apiData) => {
  if (!apiData) return null;
  const cover = apiData.coverUrl || apiData.cover_url || apiData.image || apiData.image_url;
  const authorName = apiData.authors && apiData.authors.length > 0
    ? apiData.authors.map(a => a.name).join(', ')
    : (apiData.author || 'Đang cập nhật');

  return {
    ...apiData,
    id: apiData.id || apiData.book_id,
    title: apiData.title,
    price: Number(apiData.price) || 0,
    originalPrice: apiData.originalPrice || apiData.price,
    stock: apiData.stock_quantity ?? apiData.stock ?? null,
    stock_quantity: apiData.stock_quantity ?? apiData.stock ?? null,
    description: apiData.description,
    category: apiData.category,
    publisher: apiData.publisher,
    authors: apiData.authors || [],
    author: authorName,
    coverUrl: cover,
    cover_url: cover,
    image: cover,
    createdAt: apiData.created_at || apiData.createdAt,
  };
};

const withStock = async (books, options = {}) => {
  if (!books.length) return [];
  const stocks = await axiosClient.get('/inventory/availability', { ...options, params: { ids: books.map(b => b.id).join(',') } });
  const quantities = new Map(stocks.map(s => [String(s.bookId), s.quantity]));
  return books.map(book => ({ ...mapBook(book), stock: quantities.get(String(book.id)) ?? 0,
    stock_quantity: quantities.get(String(book.id)) ?? 0 }));
};

export const getBooksByIds = async (ids, options = {}) => {
  if (!ids.length) return [];
  const books = await axiosClient.get('/catalog/books/batch', { ...options, params: { ids: [...new Set(ids)].join(',') } });
  return withStock(books, options);
};

export const getBestsellers = async ({ limit = 12 } = {}, options = {}) => {
  const ranks = await axiosClient.get('/orders/bestsellers', { ...options, params: { limit } });
  const books = await getBooksByIds(ranks.map(rank => rank.bookId), options);
  const byId = new Map(books.map(book => [String(book.id), book]));
  return { data: ranks.filter(rank => byId.has(String(rank.bookId))).map(rank => ({
    ...byId.get(String(rank.bookId)), soldCount: rank.soldCount,
  })) };
};

export const getBooks = (params = {}, options = {}) => {
  return makeRequest('getBooks', [params], async () => {
    const p = catalogFilterParams(params);
    if (params.sort) p.sort = ({ price_asc: 'price-asc', price_desc: 'price-desc' })[params.sort] ?? params.sort;
    p.size = params.size || params.limit || 20;
    const rawPage = params.page !== undefined ? Number(params.page) : 1;
    p.page = rawPage > 0 ? rawPage - 1 : 0;

    const res = await axiosClient.get(ENDPOINTS.BOOKS.LIST, { ...options, params: p });

    // Spring PageResponse normalization
    if (res && Array.isArray(res.content)) {
      return {
        data: await withStock(res.content, options),
        total: res.totalElements,
        page: (res.page !== undefined ? res.page : p.page) + 1,
        size: res.size,
        totalPages: res.totalPages,
      };
    }
    if (Array.isArray(res)) {
      return { data: await withStock(res, options), total: res.length };
    }
    if (res?.data && Array.isArray(res.data)) {
      return { ...res, data: await withStock(res.data, options) };
    }
    return res;
  });
};

export const getBookDetail = (id) => {
  return makeRequest('getBookDetail', [id], async () => {
    const res = await axiosClient.get(ENDPOINTS.BOOKS.DETAIL(id));
    const raw = res?.data || res;
    return (await withStock([raw]))[0];
  });
};

export const searchBooks = (q, params = {}) => {
  return getBooks({ q, ...params });
};

export const createBook = (data) => {
  return makeRequest('createBook', [data], () =>
    axiosClient.post(ENDPOINTS.BOOKS.LIST, data)
  );
};

export const updateBook = (id, data) => {
  return makeRequest('updateBook', [id, data], () =>
    axiosClient.put(ENDPOINTS.BOOKS.DETAIL(id), data)
  );
};

export const deleteBook = (id) => {
  return makeRequest('deleteBook', [id], () =>
    axiosClient.delete(ENDPOINTS.BOOKS.DETAIL(id))
  );
};

export const getLowStockBooks = (params = {}) => {
  return makeRequest('getLowStockBooks', [params], async () => {
    const res = await axiosClient.get('/inventory/low-stock', { params });
    const list = res?.content || res?.data || res;
    if (!Array.isArray(list) || !list.length) return [];
    const books = await axiosClient.get('/catalog/books/batch', { params: { ids: list.map(s => s.bookId).join(',') } });
    const quantities = new Map(list.map(s => [String(s.bookId), s.quantity]));
    return books.map(book => mapBook({ ...book, stock_quantity: quantities.get(String(book.id)) }));
  });
};

export const getCategories = (params = {}) => {
  return axiosClient.get(ENDPOINTS.CATEGORIES?.LIST || '/catalog/categories', { params })
    .then(res => {
      const list = res?.content || res?.data || res;
      return Array.isArray(list) ? { data: list } : res;
    });
};

export const getAuthors = (params = {}) => {
  return axiosClient.get(ENDPOINTS.AUTHORS?.LIST || '/catalog/authors', { params })
    .then(res => {
      const list = res?.content || res?.data || res;
      return Array.isArray(list) ? { data: list } : res;
    });
};

export const getPublishers = (params = {}) => {
  return axiosClient.get(ENDPOINTS.PUBLISHERS?.LIST || '/catalog/publishers', { params })
    .then(res => {
      const list = res?.content || res?.data || res;
      return Array.isArray(list) ? { data: list } : res;
    });
};

export const getBookFilters = (params = {}, options = {}) => axiosClient.get('/catalog/filters', {
  ...options, params: catalogFilterParams(params),
});
