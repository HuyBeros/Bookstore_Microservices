import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';

const emptyBook = { title: '', price: '', description: '', categoryId: '', publisherId: '', authorIds: [], coverUrl: '' };
export default function BookFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyBook);
  const [metadata, setMetadata] = useState({ categories: [], authors: [], publishers: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([bookApi.getCategories({ size: 100 }), bookApi.getAuthors({ size: 100 }),
      bookApi.getPublishers({ size: 100 }), id ? bookApi.getBookDetail(id) : null])
      .then(([categories, authors, publishers, book]) => {
        if (!active) return;
        setMetadata({ categories: categories.data, authors: authors.data, publishers: publishers.data });
        if (book) setForm({ title: book.title, price: book.price, description: book.description ?? '',
          categoryId: String(book.category.id), publisherId: String(book.publisher.id),
          authorIds: book.authors.map(a => String(a.id)), coverUrl: book.coverUrl ?? '' });
      }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const change = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    if (!form.authorIds.length) { setError('Vui lòng chọn ít nhất một tác giả'); return; }
    setSaving(true); setError('');
    try {
      const data = { ...form, price: Number(form.price), categoryId: Number(form.categoryId),
        publisherId: Number(form.publisherId), authorIds: form.authorIds.map(Number) };
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
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <form onSubmit={submit} className="space-y-5">
      <label className="block space-y-2"><span>Tên sách</span><input className={inputClass} name="title" value={form.title} onChange={change} required maxLength={255} /></label>
      <label className="block space-y-2"><span>Giá bán (VND)</span><input className={inputClass} name="price" type="number" min="0" step="1" value={form.price} onChange={change} required /></label>
      <label className="block space-y-2"><span>Danh mục</span><select className={inputClass} name="categoryId" value={form.categoryId} onChange={change} required><option value="">Chọn danh mục</option>{metadata.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="block space-y-2"><span>Nhà xuất bản</span><select className={inputClass} name="publisherId" value={form.publisherId} onChange={change} required><option value="">Chọn nhà xuất bản</option>{metadata.publishers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <fieldset className="space-y-2"><legend>Tác giả</legend><div className="flex flex-wrap gap-4">{metadata.authors.map(a => <label key={a.id} className="flex items-center gap-2"><input type="checkbox" checked={form.authorIds.includes(String(a.id))} onChange={event => setForm(prev => ({ ...prev, authorIds: event.target.checked ? [...prev.authorIds, String(a.id)] : prev.authorIds.filter(value => value !== String(a.id)) }))} />{a.name}</label>)}</div></fieldset>
      <label className="block space-y-2"><span>Đường dẫn ảnh bìa</span><input className={inputClass} name="coverUrl" type="url" value={form.coverUrl} onChange={change} maxLength={500} /></label>
      <label className="block space-y-2"><span>Mô tả</span><textarea className={inputClass} name="description" rows={5} value={form.description} onChange={change} maxLength={10000} /></label>
      <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu sách'}</button>
    </form>
  </div>;
}
