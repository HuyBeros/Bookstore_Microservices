import test from 'node:test';
import assert from 'node:assert/strict';
import { addedToCatalog, authorLabel, loadDiscoveryBooks } from '../src/utils/homeBooks.js';

test('authors preserve full names and only abbreviate a structured author list', () => {
  assert.deepEqual(authorLabel({ authors: [{ name: 'Jocko Willink' }, { name: 'Leif Babin' }] }),
    { short: 'Jocko Willink +1', full: 'Jocko Willink, Leif Babin' });
  assert.equal(authorLabel({ author: 'Brad Stulberg & Steve Magness' }).short, 'Brad Stulberg & Steve Magness');
  assert.equal(authorLabel({ authors: [' Brad Stulberg ', 'Steve Magness', 'Brad Stulberg', null] }).short, 'Brad Stulberg +1');
  assert.equal(authorLabel({}).short, 'Đang cập nhật');
});

test('new-in-catalog labels use creation date, never publication/update date or a fabricated date', () => {
  const now = Date.parse('2026-11-01T12:00:00Z');
  assert.equal(addedToCatalog({ createdAt: '2026-10-31T18:00:00Z' }, now).label, '1/11/2026');
  assert.equal(addedToCatalog({ createdAt: '2026-10-31' }, now).recent, true);
  assert.equal(addedToCatalog({ created_at: '2024-01-01' }, now).recent, false);
  for (const book of [{}, { updatedAt: '2026-11-01' }, { createdAt: 'invalid' }, { createdAt: '2027-01-01' }]) {
    assert.equal(addedToCatalog(book, now), null);
  }
});

const book = (id, category) => ({ id, category: { id: category } });

test('discovery fetches four categories absent from the latest shelf and excludes duplicate IDs', async () => {
  const latest = Array.from({ length: 12 }, (_, i) => book(i + 1, 1));
  const categories = [1, 2, 3, 4, 5].map(id => ({ id, count: 30 }));
  const calls = [];
  const result = await loadDiscoveryBooks(latest, categories, async params => {
    calls.push(params);
    return { data: [book(1, params.categoryId), book(params.categoryId * 100, params.categoryId)] };
  });
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map(call => call.categoryId), [2, 3, 4, 5]);
  assert.deepEqual(result.books.map(book => book.id), [200, 300, 400, 500]);
  assert.equal(result.incomplete, false);
});

test('small catalogs round-robin remaining books without duplicating either shelf or inventing content', async () => {
  const result = await loadDiscoveryBooks([book(1, 1)], [{ id: 1, count: 5 }, { id: 2, count: 2 }], async params => ({
    data: params.categoryId === 1 ? [book(1, 1), book(2, 1), book(3, 1), book(4, 1)] : [book(8, 2), book(8, 2)],
  }));
  assert.deepEqual(result.books.map(book => book.id), [8, 2, 3, 4]);
  assert.deepEqual(await loadDiscoveryBooks([book(1, 1)], [{ id: 1, count: 1 }], () => { throw new Error('must not fetch'); }),
    { books: [], incomplete: false });
});

test('discovery preserves successful categories when another service request fails', async () => {
  const result = await loadDiscoveryBooks([], [{ id: 1, count: 1 }, { id: 2, count: 1 }], async params => {
    if (params.categoryId === 1) throw new Error('temporarily unavailable');
    return { data: [book(9, 2)] };
  });
  assert.equal(result.incomplete, true);
  assert.deepEqual(result.books.map(book => book.id), [9]);
});

test('editorial shelves query selected titles, then fall back when a title already appears above', async () => {
  const calls = [];
  const result = await loadDiscoveryBooks([book(1, 1)], [{id:1,name:'Fiction',count:4}, {id:2,name:'Science',count:3}], async params => {
    calls.push(params);
    if (params.q === 'Chosen fiction') return {data:[book(1,1)]};
    return {data:[book(params.categoryId === 1 ? 3 : 8, params.categoryId)]};
  }, {}, [{category:'Fiction',title:'Chosen fiction'}, {category:'Science',title:'Chosen science'}]);
  assert.deepEqual(result.books.map(book => book.id), [8,3]);
  assert.equal(calls.filter(call=>call.q).length, 2);
  assert.equal(calls.filter(call=>!call.q).length, 1);
});
