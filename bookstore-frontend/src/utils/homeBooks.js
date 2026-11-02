export function authorLabel(book) {
  const names = [...new Set((book?.authors ?? []).map(author =>
    typeof author === 'string' ? author.trim() : (author?.name ?? author?.authorName ?? '').trim()
  ).filter(Boolean))];
  if (!names.length) {
    const fallback = book?.author?.trim() || 'Đang cập nhật';
    return { short: fallback, full: fallback };
  }
  return { short: names[0] + (names.length > 1 ? ` +${names.length - 1}` : ''), full: names.join(', ') };
}

export function addedToCatalog(book, now = Date.now()) {
  const value = book?.createdAt ?? book?.created_at;
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() > now) return null;
  return {
    iso: date.toISOString(),
    label: date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    recent: now - date.getTime() <= 30 * 24 * 60 * 60 * 1000,
  };
}

// Reuse category filters rather than sampling one page dominated by one category.
// A bounded set of category requests; editorial title searches have a category fallback.
export async function loadDiscoveryBooks(latest, categories, fetchBooks, options = {}, editorial = []) {
  const excluded = new Set(latest.map(book => String(book.id)));
  const counts = new Map();
  latest.forEach(book => {
    const id = String(book.category?.id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  const recipeIndex = category => editorial.findIndex(recipe => recipe.category === category.name);
  const chosen = [...categories].filter(category => category.count > (counts.get(String(category.id)) ?? 0))
    .filter(category => !editorial.length || recipeIndex(category) >= 0)
    .sort((a, b) => Number(counts.has(String(a.id))) - Number(counts.has(String(b.id)))
      || (editorial.length ? recipeIndex(a) - recipeIndex(b) : b.count - a.count)
      || String(a.id).localeCompare(String(b.id), 'en', { numeric: true }))
    .slice(0, editorial.length || 4);
  const target = editorial.length || 4;
  const results = await Promise.allSettled(chosen.map(async category => {
    const params = { categoryId: category.id, limit: (counts.get(String(category.id)) ?? 0) + target, sort: 'title' };
    const recipe = editorial[recipeIndex(category)];
    if (recipe) {
      const preferred = await fetchBooks({ ...params, q: recipe.title }, options);
      if (preferred?.data?.some(book => !excluded.has(String(book.id)))) return preferred;
    }
    return fetchBooks(params, options);
  }));
  const pools = results.map((result, index) => result.status === 'fulfilled'
    ? (result.value?.data ?? []).filter(book => book.id != null && !excluded.has(String(book.id))
      && String(book.category?.id) === String(chosen[index].id)) : []);
  const books = [];
  // Take one from each category before filling from categories with more books.
  while (books.length < target && pools.some(pool => pool.length)) {
    for (const pool of pools) {
      let book;
      do { book = pool.shift(); } while (book && excluded.has(String(book.id)));
      if (book) { books.push(book); excluded.add(String(book.id)); }
      if (books.length === target) break;
    }
  }
  return { books, incomplete: results.some(result => result.status === 'rejected') };
}
