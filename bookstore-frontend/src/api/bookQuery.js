export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
const positiveIds = values => [...new Set(values.flatMap(value => String(value).split(',')).filter(id => /^[1-9]\d*$/.test(id)))];
const numberParam = (value, fallback, max) => /^\d+$/.test(value ?? '') && Number(value) > 0 ? Math.min(Number(value), max) : fallback;
export const readBookQuery = params => ({
  q: (params.get('q') ?? '').trim(),
  categoryIds: positiveIds([...params.getAll('categoryId'), ...params.getAll('categoryIds'), ...params.getAll('category')]),
  authorIds: positiveIds([...params.getAll('authorId'), ...params.getAll('authorIds'), ...params.getAll('author')]),
  publisherIds: positiveIds([...params.getAll('publisherId'), ...params.getAll('publisherIds'), ...params.getAll('publisher')]),
  minPrice: params.get('minPrice') ?? '', maxPrice: params.get('maxPrice') ?? '',
  sort: ({ price_asc: 'price-asc', price_desc: 'price-desc' })[params.get('sort')] ??
    (['newest', 'price-asc', 'price-desc', 'title'].includes(params.get('sort')) ? params.get('sort') : 'newest'),
  page: numberParam(params.get('page'), 1, 100001),
  pageSize: numberParam(params.get('pageSize'), 16, 100),
});
export const updateBookQuery = (current, updates) => {
  const params = new URLSearchParams(current);
  const aliases = { categoryId: ['category', 'categoryIds'], authorId: ['author', 'authorIds'], publisherId: ['publisher', 'publisherIds'] };
  for (const [key, value] of Object.entries(updates)) {
    for (const alias of aliases[key] ?? []) params.delete(alias);
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && !value.length)) params.delete(key);
    else params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  if (!Object.hasOwn(updates, 'page')) params.set('page', '1');
  // Only filters backed by catalog data are retained.
  for (const key of ['cover', 'rating', 'genre', 'tag', 'status']) params.delete(key);
  return params;
};
export const catalogFilterParams = (params = {}) => {
  const result = {};
  const q = params.search ?? params.q;
  if (q?.trim()) result.q = q.trim();
  for (const [name, legacy] of [['category', 'category_id'], ['author', 'author_id'], ['publisher', 'publisher_id']]) {
    const values = params[`${name}Ids`];
    if (values?.length) result[`${name}Ids`] = values.join(',');
    else if (params[`${name}Id`] ?? params[legacy]) result[`${name}Id`] = params[`${name}Id`] ?? params[legacy];
  }
  for (const [key, legacy] of [['minPrice', 'min_price'], ['maxPrice', 'max_price']]) {
    const value = params[key] ?? params[legacy];
    if (value !== '' && value !== null && value !== undefined) result[key] = value;
  }
  return result;
};
