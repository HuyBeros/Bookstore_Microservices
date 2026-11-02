import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { normalizeText } from '../../api/bookQuery';

function OptionGroup({ title, options, selected, onChange, searchable = false }) {
  const [search, setSearch] = useState('');
  const visible = options.filter(option => (option.count > 0 || selected.includes(String(option.id)))
    && option.name.replace(/&nbsp;|&#160;/g, ' ').trim()
    && normalizeText(option.name).includes(normalizeText(search)))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  return <section className="space-y-3 border-t border-border pt-5">
    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">{title}</h3>
    {searchable && <div className="relative"><Search size={14} className="absolute left-3 top-3 text-ink-muted" />
      <input type="search" aria-label={`Tìm ${title.toLowerCase()}`} placeholder={`Tìm ${title.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-xs" /></div>}
    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
      {visible.map(option => {
        const checked = selected.includes(String(option.id));
        const disabled = option.count === 0 && !checked;
        return <label key={option.id} className={`flex items-start justify-between gap-3 text-xs ${disabled ? 'text-ink-muted/60' : 'cursor-pointer text-ink-body hover:text-primary'}`}>
          <span className="flex min-w-0 items-start gap-2.5"><input type="checkbox" checked={checked} disabled={disabled} onChange={() => onChange(checked ? selected.filter(id => id !== String(option.id)) : [...selected, String(option.id)])} className="mt-0.5 size-4 shrink-0 accent-primary" /><span className={checked ? 'font-semibold text-primary' : ''}>{option.name}</span></span>
          <span className="shrink-0 tabular-nums text-ink-muted">{option.count}</span>
        </label>;
      })}
      {!visible.length && <p className="text-xs text-ink-muted">Không có lựa chọn phù hợp.</p>}
    </div>
  </section>;
}
function PriceFilter({ minPrice, maxPrice, onChange }) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const [error, setError] = useState('');
  const apply = event => {
    event.preventDefault();
    if ((min !== '' && (!Number.isFinite(Number(min)) || Number(min) < 0)) || (max !== '' && (!Number.isFinite(Number(max)) || Number(max) < 0))) { setError('Giá phải là số không âm.'); return; }
    if (min !== '' && max !== '' && Number(min) > Number(max)) { setError('Giá từ phải nhỏ hơn hoặc bằng giá đến.'); return; }
    setError(''); onChange({ minPrice: min, maxPrice: max });
  };
  return <section className="space-y-3 border-t border-border pt-5">
    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Khoảng giá (VNĐ)</h3>
    <form onSubmit={apply} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-ink-muted"><span>Từ</span><input aria-label="Giá từ" type="number" min="0" step="1" value={min} onChange={e => setMin(e.target.value)} placeholder="0" className="w-full rounded-xl border border-border bg-white p-2.5 text-ink" /></label>
        <label className="space-y-1 text-xs text-ink-muted"><span>Đến</span><input aria-label="Giá đến" type="number" min="0" step="1" value={max} onChange={e => setMax(e.target.value)} placeholder="Không giới hạn" className="w-full rounded-xl border border-border bg-white p-2.5 text-ink" /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">{[['Dưới 100k','0','99999'],['100k – 200k','100000','199999'],['200k – 500k','200000','499999'],['Trên 500k','500000','']].map(([label, low, high]) => <button key={label} type="button" onClick={() => { setMin(low); setMax(high); setError(''); onChange({ minPrice: low, maxPrice: high }); }} className="rounded-xl border border-border px-2 py-2 text-xs text-ink-body hover:border-primary hover:text-primary">{label}</button>)}</div>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <button className="w-full rounded-xl bg-cta px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary">Áp dụng mức giá</button>
    </form>
  </section>;
}
export default function CatalogFilters({ facets, filters, onChange, onClear, active, loading, error, onClose }) {
  return <div className="space-y-5 rounded-2xl border border-border bg-white p-5 lg:p-6">
    <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-serif text-base font-bold"><SlidersHorizontal size={17} className="text-primary" />Bộ lọc tìm kiếm</h2>{active && <button onClick={onClear} className="text-xs font-semibold text-cta hover:underline">Xóa tất cả</button>}</div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {!facets && loading ? <p role="status" className="text-xs text-ink-muted">Đang tải bộ lọc…</p> : <>
      <OptionGroup title="Danh mục thể loại" options={facets?.categories ?? []} selected={filters.categoryIds} onChange={ids => onChange({ categoryId: ids })} />
      <PriceFilter key={`${filters.minPrice}:${filters.maxPrice}`} minPrice={filters.minPrice} maxPrice={filters.maxPrice} onChange={onChange} />
      <OptionGroup title="Nhà xuất bản" options={facets?.publishers ?? []} selected={filters.publisherIds} onChange={ids => onChange({ publisherId: ids })} searchable />
      <OptionGroup title="Tác giả" options={facets?.authors ?? []} selected={filters.authorIds} onChange={ids => onChange({ authorId: ids })} searchable />
    </>}
    {onClose && <button type="button" onClick={onClose} className="w-full rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary lg:hidden">Xem kết quả tìm kiếm</button>}
  </div>;
}
