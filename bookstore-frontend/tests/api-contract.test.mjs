import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { resolve, dirname } from 'node:path';
import { mapOrder, mapCart } from '../src/api/normalizers.js';

async function apiHarness(service, result) {
  const calls = [];
  const modules = new Map();
  const client = Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method => [method,
    async (...args) => { calls.push({ method, args }); return typeof result === 'function' ? result(method, args) : result; }]));
  const clientModule = new SyntheticModule(['default'], function () { this.setExport('default', client); });
  const requestModule = new SyntheticModule(['makeRequest'], function () {
    this.setExport('makeRequest', async (_name, _args, real) => real());
  });
  async function load(file) {
    if (file.endsWith('axiosClient.js')) return clientModule;
    if (file.endsWith('request.js')) return requestModule;
    if (modules.has(file)) return modules.get(file);
    const mod = new SourceTextModule(await readFile(file, 'utf8'), {
      identifier: file, initializeImportMeta(meta) { meta.env = {}; },
    });
    modules.set(file, mod);
    await mod.link(spec => load(resolve(dirname(file), spec.endsWith('.js') ? spec : spec + '.js')));
    return mod;
  }
  const mod = await load(resolve('src/api/services', service + '.js'));
  await mod.evaluate();
  return { api: mod.namespace, calls };
}

test('cart sends camelCase fields and deletes the cart at its actual route', async () => {
  const { api, calls } = await apiHarness('cartApi', { items: [{ bookId: 3, unitPrice: 50000, quantity: 2 }] });
  const cart = await api.addToCart(3, 2);
  assert.deepEqual(calls[0].args, ['/cart/items', { bookId: 3, quantity: 2 }]);
  assert.equal(cart.items[0].price, 50000);
  await api.clearCart();
  assert.deepEqual(calls[1], { method: 'delete', args: ['/cart'] });
});

test('order creation uses server fields, exposes its actual ID and keeps customer listing separate', async () => {
  const { api, calls } = await apiHarness('orderApi', { orderId: 12, totalAmount: 130000, items: [] });
  const order = await api.createOrder({ shipping_address: 'Hanoi', payment_method: 'COD' });
  assert.equal(order.id, '12');
  assert.equal(calls[0].args[1].shippingAddress, 'Hanoi');
  assert.equal(calls[0].args[1].paymentMethod, 'COD');
  await api.updateOrderStatus(12, 'CONFIRMED');
  assert.deepEqual(calls[1], { method: 'patch', args: ['/orders/12/status', { status: 'CONFIRMED' }] });
  const list = await apiHarness('orderApi', [{ orderId: 12, orderStatus: 'PENDING' }]);
  assert.equal((await list.api.getMyOrders({ status: 'pending' }))[0].id, '12');
  assert.equal(list.calls[0].args[0], '/orders/my');
});

test('profile, password and admin role use backend methods and payloads', async () => {
  const auth = await apiHarness('authApi', { userId: 5, fullName: 'Alice' });
  await auth.api.updateProfile({ full_name: 'Alice' });
  assert.equal(auth.calls[0].args[0], '/users/profile');
  await auth.api.changePassword({ current_password: 'old', new_password: 'new' });
  assert.deepEqual(auth.calls[1], { method: 'put', args: ['/users/change-password', { oldPassword: 'old', newPassword: 'new' }] });
  const users = await apiHarness('userApi', { userId: 5 });
  await users.api.updateUserRole(5, 'STAFF');
  assert.deepEqual(users.calls[0], { method: 'patch', args: ['/admin/users/5/role', { role: 'STAFF' }] });
});

test('AI calls the POST recommendation endpoint and inventory sends bookId', async () => {
  const ai = await apiHarness('aiApi', { answer: 'Books' });
  await ai.api.suggestBooks({ message: 'Java' });
  assert.equal(ai.calls[0].method, 'post'); assert.equal(ai.calls[0].args[0], '/ai/recommendations');
  assert.equal(ai.calls[0].args[2].timeout, 45000);
  await ai.api.chatWithAI({ message: 'Có cuốn nào rẻ hơn?' });
  assert.equal(ai.calls[1].args[0], '/ai/chat');
  assert.equal(ai.calls[1].args[2].timeout, 45000);
  const inv = await apiHarness('inventoryApi', { quantity: 5 });
  await inv.api.importStock({ book_id: 3, quantity: 5 });
  assert.equal(inv.calls[0].args[1].bookId, 3);
  await inv.api.getInventoryHistory({ book_id: 3 });
  assert.equal(inv.calls[1].args[0], '/inventory/transactions');
});

test('normalizers preserve order price, stock identifiers and payment status', () => {
  const order = mapOrder({ orderId: 8, totalAmount: 230000, shippingCost: 30000,
    orderStatus: 'CONFIRMED', paymentStatus: 'UNPAID', items: [{ bookId: 1, bookTitle: 'Java', unitPrice: 100000, quantity: 2 }] });
  assert.equal(order.total_amount, 230000); assert.equal(order.shipping_cost, 30000);
  assert.equal(order.items[0].book_id, 1); assert.equal(order.items[0].title, 'Java');
  assert.equal(mapCart({ items: [] }).items.length, 0);
});

test('public bestsellers preserve sales ranking while hydrating current catalog price and stock', async () => {
  const { api, calls } = await apiHarness('bookApi', (_method, args) => {
    if (args[0] === '/orders/bestsellers') return [{ bookId: 22, soldCount: 8 }, { bookId: 11, soldCount: 3 }, { bookId: 99, soldCount: 1 }];
    if (args[0] === '/catalog/books/batch') return [{ id: 11, title: 'Eleven', price: 70000 }, { id: 22, title: 'Twenty-two', price: 90000 }];
    if (args[0] === '/inventory/availability') return [{ bookId: 11, quantity: 1 }, { bookId: 22, quantity: 4 }];
    throw new Error('Unexpected request');
  });
  const result = await api.getBestsellers({ limit: 12 });
  assert.deepEqual(result.data.map(book => [book.id, book.soldCount, book.price, book.stock]), [[22,8,90000,4],[11,3,70000,1]]);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].args[1].params.limit, 12);
});

test('an empty bestseller ranking does not substitute newly added books', async () => {
  const { api, calls } = await apiHarness('bookApi', []);
  assert.deepEqual((await api.getBestsellers()).data, []);
  assert.equal(calls.length, 1);
});


test('cart and checkout render with the real context interface before data arrives', async () => {
  const { createServer } = await import('vite');
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  const { MemoryRouter } = await import('react-router-dom');
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const server = await createServer({ cacheDir: resolve('../.cache/vite-ssr-tests'), server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.jsx');
    const { CartProvider } = await server.ssrLoadModule('/src/context/CartContext.jsx');
    const { ToastProvider } = await server.ssrLoadModule('/src/context/ToastContext.jsx');
    for (const path of ['CartPage', 'CheckoutPage']) {
      const { default: Page } = await server.ssrLoadModule(`/src/pages/customer/${path}.jsx`);
      const html = renderToString(React.createElement(MemoryRouter, null,
        React.createElement(AuthProvider, null, React.createElement(ToastProvider, null,
          React.createElement(CartProvider, null, React.createElement(Page))))));
      assert.ok(html.includes('Giỏ hàng') || html.includes('giỏ hàng'));
    }
  } finally { await server.close(); delete globalThis.localStorage; }
});


test('catalog query preserves zero prices, multiple IDs and page navigation', async () => {
  const { readBookQuery, updateBookQuery, catalogFilterParams } = await import('../src/api/bookQuery.js');
  const initial = new URLSearchParams('q=nghe+thuat&categoryId=2,3&minPrice=0&maxPrice=0&page=2&sort=price_asc');
  const parsed = readBookQuery(initial);
  assert.deepEqual(parsed.categoryIds, ['2', '3']);
  assert.equal(parsed.sort, 'price-asc');
  assert.equal(updateBookQuery(initial, { page: 3 }).get('page'), '3');
  const changed = updateBookQuery(initial, { publisherId: ['8', '9'] });
  assert.equal(changed.get('page'), '1');
  assert.equal(changed.get('q'), 'nghe thuat');
  assert.deepEqual(catalogFilterParams(parsed), { q: 'nghe thuat', categoryIds: '2,3', minPrice: '0', maxPrice: '0' });
  const { api, calls } = await apiHarness('bookApi', (_method, args) => args[0] === '/inventory/availability'
    ? [{ bookId: 7, quantity: 3 }]
    : { content: [{ id: 7, title: 'Real book', price: 0 }], totalElements: 1, totalPages: 1, page: 0, size: 16 });
  const response = await api.getBooks({ q: 'nghe thuat', categoryIds: ['2','3'], minPrice: 0, maxPrice: 0, sort: 'price-asc', page: 1 });
  assert.equal(calls[0].args[1].params.minPrice, 0);
  assert.equal(calls[0].args[1].params.maxPrice, 0);
  assert.equal(calls[0].args[1].params.categoryIds, '2,3');
  assert.equal(response.data[0].stock_quantity, 3);
  const empty = await apiHarness('bookApi', { content: [], totalElements: 0, totalPages: 0 });
  assert.deepEqual((await empty.api.getBooks({ q: 'no result' })).data, []);
  assert.equal(empty.calls.length, 1);
});
