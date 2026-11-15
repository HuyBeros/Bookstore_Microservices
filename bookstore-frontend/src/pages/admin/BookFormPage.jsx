import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authorApi, bookApi, categoryApi, publisherApi } from '../../api/services';
import { normalizeText } from '../../api/bookQuery';
import { useToast } from '../../context/ToastContext';

const emptyBook = { title: '', price: '', description: '', categoryId: '', publisherId: '', authors: [], coverUrl: '' };
const AUTHOR_LIMIT = 20;
const AUTHOR_NAME_LIMIT = 100;

async function loadAuthors() {
  const first = await authorApi.getAuthors({ size: 100 });
  const otherPages = [];
  for (let page = 2; page <= first.totalPages; page++) {
    otherPages.push(authorApi.getAuthors({ page, size: 100 }));
  }
  const pages = await Promise.all(otherPages);
  return [first, ...pages].flatMap(page => page.data);
}

export default function BookFormPage() {
  const { id } = useParams();
  return <BookForm key={id ?? 'new'} id={id} />;
}

function BookForm({ id }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyBook);
  const [metadata, setMetadata] = useState({ categories: [], authors: [], publishers: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [creatingAuthor, setCreatingAuthor] = useState(false);
  const authorSearch = useRef(null);
  useEffect(() => {
    let active = true;
    Promise.all([categoryApi.getCategories({ size: 100 }), loadAuthors(),
      publisherApi.getPublishers({ size: 100 }), id ? bookApi.getBookDetail(id) : null])
      .then(([categories, authors, publishers, book]) => {
        if (!active) return;
        setMetadata({ categories: categories.data, authors, publishers: publishers.data });
        if (book) setForm({ title: book.title, price: book.price, description: book.description ?? '',
          categoryId: String(book.category?.id ?? ''), publisherId: String(book.publisher?.id ?? ''),
          authors: book.authors, coverUrl: book.coverUrl ?? '' });
      }).catch(err => { if (active) setLoadError(err.message || 'Chưa tải được thông tin sách.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const change = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  const query = normalizeText(authorQuery).replace(/\s+/g, ' ');
  const authorName = authorQuery.trim().replace(/\s+/g, ' ');
  const matches = query ? metadata.authors.filter(author =>
    normalizeText(author.name).replace(/\s+/g, ' ').includes(query)) : [];
  const exact = matches.find(author => normalizeText(author.name).replace(/\s+/g, ' ') === query);
  const selectedIds = new Set(form.authors.map(author => String(author.id)));
  const suggestions = (exact ? [exact, ...matches.filter(author => author !== exact)] : matches)
    .filter(author => !selectedIds.has(String(author.id))).slice(0, 8);
  const atAuthorLimit = form.authors.length >= AUTHOR_LIMIT;

  const addAuthor = author => {
    setForm(previous => previous.authors.length >= AUTHOR_LIMIT || previous.authors.some(item => String(item.id) === String(author.id))
      ? previous : { ...previous, authors: [...previous.authors, author] });
    setAuthorQuery('');
    setAuthorError('');
    authorSearch.current?.focus();
  };

  const createAuthor = async () => {
    if (!authorName || exact || atAuthorLimit || creatingAuthor) return;
    setCreatingAuthor(true);
    setAuthorError('');
    try {
      const result = await authorApi.createAuthor({ name: authorName });
      const author = result.data ?? result;
      setMetadata(previous => ({ ...previous, authors: [...previous.authors, author] }));
      addAuthor(author);
    } catch (failure) {
      setAuthorError(failure.message || 'Chưa tạo được tác giả. Vui lòng thử lại.');
    } finally {
      setCreatingAuthor(false);
    }
  };

  const submit = async event => {
    event.preventDefault();
    if (creatingAuthor || saving) return;
    if (!form.authors.length) { setAuthorError('Vui lòng thêm ít nhất một tác giả.'); return; }
    if (authorName) { setAuthorError('Chọn tác giả từ gợi ý, tạo tác giả hoặc xóa tên đang nhập trước khi lưu.'); return; }
    setSaving(true); setError('');
    try {
      const { authors, ...fields } = form;
      const data = { ...fields, price: Number(form.price), categoryId: Number(form.categoryId),
        publisherId: Number(form.publisherId), authorIds: authors.map(author => Number(author.id)) };
      if (id) await bookApi.updateBook(id, data); else await bookApi.createBook(data);
      showToast({ type: 'success', message: 'Đã lưu thông tin sách' });
      navigate('/admin/books');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
  if (loading) return <p role="status">Đang tải thông tin sách…</p>;
  return <div className="max-w-3xl space-y-6">
    <Link to="/admin/books" className="text-primary">← Danh sách sách</Link>
    <h1 className="text-2xl font-bold">{id ? 'Chỉnh sửa sách' : 'Thêm sách'}</h1>
    {loadError && <p role="alert" className="text-danger">{loadError}</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {!loadError && <form onSubmit={submit} className="space-y-5">
      <label className="block space-y-2"><span>Tên sách</span><input className={inputClass} name="title" value={form.title} onChange={change} required maxLength={255} /></label>
      <label className="block space-y-2"><span>Giá bán (VND)</span><input className={inputClass} name="price" type="number" min="0" step="1" value={form.price} onChange={change} required /></label>
      <label className="block space-y-2"><span>Danh mục</span><select className={inputClass} name="categoryId" value={form.categoryId} onChange={change} required><option value="">Chọn danh mục</option>{metadata.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="block space-y-2"><span>Nhà xuất bản</span><select className={inputClass} name="publisherId" value={form.publisherId} onChange={change} required><option value="">Chọn nhà xuất bản</option>{metadata.publishers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <fieldset className="space-y-2" disabled={saving || creatingAuthor}>
        <legend className="mb-2">Tác giả</legend>
        {form.authors.length > 0 && <ul aria-label="Tác giả đã thêm" className="flex flex-wrap gap-2">
          {form.authors.map(author => <li key={author.id} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-sm">
            <span className="wrap-anywhere">{author.name}</span>
            <button type="button" aria-label={`Bỏ ${author.name}`} className="grid size-9 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
              onClick={() => setForm(previous => ({ ...previous, authors: previous.authors.filter(item => String(item.id) !== String(author.id)) }))}>×</button>
          </li>)}
        </ul>}
        <label htmlFor="book-author-search" className="sr-only">Tìm tác giả theo tên</label>
        <input id="book-author-search" ref={authorSearch} type="search" className={inputClass} placeholder="Nhập tên tác giả…"
          value={authorQuery} maxLength={AUTHOR_NAME_LIMIT} autoComplete="off"
          aria-describedby="book-author-help" aria-invalid={authorError ? true : undefined}
          onChange={event => { setAuthorQuery(event.target.value); setAuthorError(''); }}
          onKeyDown={event => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (exact && !selectedIds.has(String(exact.id))) addAuthor(exact);
            else if (!exact && suggestions.length === 1) addAuthor(suggestions[0]);
          }} />
        <p id="book-author-help" className="text-sm text-ink-muted">
          {atAuthorLimit ? `Đã thêm tối đa ${AUTHOR_LIMIT} tác giả.` : 'Chọn từ gợi ý hoặc tạo tác giả mới bằng tên đã nhập.'}
        </p>
        {authorError && <p role="alert" className="text-sm text-danger">{authorError}</p>}
        {query && !atAuthorLimit && <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-surface">
          {suggestions.map(author => <button key={author.id} type="button" onClick={() => addAuthor(author)}
            className="block min-h-11 w-full px-3 text-left text-sm hover:bg-surface-muted">{author.name}</button>)}
          {exact && selectedIds.has(String(exact.id)) && <p className="px-3 py-2 text-sm text-ink-muted">Tác giả này đã được thêm.</p>}
          {!exact && <button type="button" onClick={createAuthor}
            className="block min-h-11 w-full px-3 text-left text-sm font-medium text-primary hover:bg-surface-muted">
            {creatingAuthor ? 'Đang tạo tác giả…' : `Tạo tác giả “${authorName}”`}
          </button>}
        </div>}
      </fieldset>
      <label className="block space-y-2"><span>Đường dẫn ảnh bìa</span><input className={inputClass} name="coverUrl" type="url" value={form.coverUrl} onChange={change} maxLength={500} /></label>
      <label className="block space-y-2"><span>Mô tả</span><textarea className={inputClass} name="description" rows={5} value={form.description} onChange={change} maxLength={10000} /></label>
      <button type="submit" disabled={saving || creatingAuthor} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu sách'}</button>
    </form>}
  </div>;
}
