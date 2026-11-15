import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminBriefing } from '../../../api/services/aiApi';
import { getBooks } from '../../../api/services/bookApi';
import ChatIcon from '../ChatWidget/ChatIcon';
import '../ChatWidget/ChatWidget.css';
import './AdminBriefing.css';

const prompts = [
  'Hôm nay cần xử lý gì trước?',
  'Có bao nhiêu đơn chờ xác nhận?',
  'Sách nào sắp hết hàng?',
  'Top 5 cuốn sách đắt nhất',
];
const count = new Intl.NumberFormat('vi-VN');
const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const checkedTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function topicFor(text) {
  if (/\b(doanh thu|ban chay|hom qua|tuan truoc|thang truoc|tuan nay|thang nay|huy don|duyet don|nhap them|nhap kho)\b/.test(text)) return null;
  if (/\b(dat nhat|gia cao nhat|gia ban cao nhat)\b/.test(text)) return 'prices';
  const orders = /\b(don|cho duyet|cho xac nhan)\b/.test(text);
  const stock = /\b(ton kho|sap het|het hang|kho hang|con lai)\b/.test(text);
  if (orders && stock || /\b(uu tien|xu ly gi|tong quan|tong hop|viec can lam)\b/.test(text)) return 'overview';
  if (orders) return 'orders';
  if (stock) return 'stock';
  return null;
}

function PriceResult({ books, onNavigate }) {
  if (!books.length) return <p className="book-chat-bubble">Danh mục hiện chưa có sách.</p>;
  return <section className="book-chat-recommendations">
    <p>{books.length} đầu sách có giá cao nhất trong danh mục</p>
    <ul>
      {books.map(book => <li key={book.id}>
        <Link className="book-chat-book justify-between gap-3" to={`/books/${book.id}`} onClick={onNavigate}>
          <span className="min-w-0 wrap-anywhere">{book.title}</span>
          <span className="shrink-0 text-ink tabular-nums">{price.format(book.price)}</span>
        </Link>
      </li>)}
    </ul>
  </section>;
}

function BriefingSource({ title, total, unit, href, action, onNavigate, children }) {
  return <section className="book-chat-recommendations">
    <p>{title}</p>
    <p className="mt-1 text-sm text-ink">{total == null ? 'Chưa lấy được dữ liệu.' : `${count.format(total)} ${unit}`}</p>
    {children}
    <Link className="book-chat-book gap-2" to={href} onClick={onNavigate}>{action}<ChatIcon name="right" size={16} /></Link>
  </section>;
}

function BriefingResult({ briefing, topic, onNavigate }) {
  const { pendingOrders, lowStockCount, lowStockBooks, stockThreshold, priority, aiAssisted, checkedAt } = briefing;
  const missing = pendingOrders == null || lowStockCount == null;
  const summary = {
    ORDERS: 'Xem các đơn chờ xác nhận trước.',
    STOCK: 'Kiểm tra các đầu sách sắp hết trước.',
    NONE: missing ? 'Chưa đủ dữ liệu để xác định việc cần ưu tiên.' : 'Hiện chưa có đơn chờ xác nhận hoặc cảnh báo tồn kho.',
  }[priority];

  const orders = <BriefingSource key="orders" title="Đơn chờ xác nhận" total={pendingOrders} unit="đơn"
    href="/admin/orders?status=PENDING" action="Mở đơn chờ xác nhận" onNavigate={onNavigate} />;
  const stock = <BriefingSource key="stock" title="Sách sắp hết" total={lowStockCount}
    unit={`đầu sách còn từ ${stockThreshold} cuốn trở xuống`}
    href="/admin/inventory?lowStock=true" action="Mở danh sách sách sắp hết" onNavigate={onNavigate}>
    {lowStockBooks.length > 0 && <ul className="mt-2 divide-y divide-border">
      {lowStockBooks.map(book => <li key={book.bookId} className="flex items-baseline justify-between gap-3 py-2 text-sm">
        <span className="min-w-0 wrap-anywhere">{book.title || `Sách #${book.bookId}`}</span>
        <span className="shrink-0 text-ink-muted tabular-nums">{book.quantity ? `Còn ${book.quantity} cuốn` : 'Hết hàng'}</span>
      </li>)}
    </ul>}
  </BriefingSource>;

  return <>
    {topic === 'overview' && <>
      <p className="book-chat-bubble">{summary}</p>
      {aiAssisted && <p className="book-chat-fallback">Ưu tiên do Gemini đề xuất.</p>}
      {priority === 'STOCK' ? [stock, orders] : [orders, stock]}
    </>}
    {topic === 'orders' && orders}
    {topic === 'stock' && stock}
    <p className="book-chat-fallback">Kiểm tra lúc {checkedTime.format(new Date(checkedAt))}</p>
  </>;
}

export default function AdminBriefing() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const request = useRef(null);
  const launcher = useRef(null);
  const composer = useRef(null);
  const closeButton = useRef(null);
  const timeline = useRef(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (open) {
      if (window.matchMedia('(pointer: fine)').matches) composer.current?.focus();
      else closeButton.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const list = timeline.current;
    if (!open || !list) return;
    const reply = list.querySelector('.admin-briefing-turn:last-child > .assistant');
    const bottom = list.scrollHeight - list.clientHeight;
    list.scrollTop = !busy && reply ? Math.min(bottom, reply.offsetTop - 16) : bottom;
  }, [open, turns, busy]);

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  const ask = async (input, retry = false) => {
    const question = input.trim();
    if (!question || request.current) return;
    const normalized = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
    const topic = topicFor(normalized);
    const updateLast = result => setTurns(previous => [...previous.slice(0, -1), { question, topic, ...result }]);
    if (retry) updateLast({});
    else {
      setDraft('');
      setTurns(previous => [...previous, { question, topic }]);
    }
    if (!topic) return;

    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      if (topic === 'prices') {
        const requested = normalized.match(/\btop\s*(\d+)/)?.[1]
          ?? normalized.match(/\b(\d+)\s+(?:(?:cuon|quyen|dau|tua)\s+)?sach\b/)?.[1];
        const limit = Math.min(20, Math.max(1, Number(requested ?? 5)));
        const result = await getBooks({ sort: 'price_desc', limit }, { signal: controller.signal, includeStock: false });
        if (!Array.isArray(result?.data)) throw new Error('Catalog data unavailable');
        if (!controller.signal.aborted) updateLast({ books: result.data });
      } else {
        const briefing = await getAdminBriefing(controller.signal);
        if (!controller.signal.aborted) updateLast({ briefing });
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        const error = {
          401: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
          403: 'Tài khoản này không có quyền xem trợ lý vận hành.',
          429: 'Bạn vừa gửi nhiều yêu cầu. Hãy thử lại sau ít phút.',
        }[failure?.status] ?? 'Chưa tải được số liệu. Hãy thử lại.';
        updateLast({ error });
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setBusy(false);
      }
    }
  };

  return <div className="book-chat-tools admin-briefing" onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); close(); }
  }}>
    <button ref={launcher} type="button" className="book-chat-launcher"
      aria-label={open ? 'Thu gọn trợ lý vận hành' : 'Mở trợ lý vận hành'}
      aria-haspopup="dialog" aria-expanded={open} aria-controls="admin-briefing-panel"
      title="Trợ lý vận hành" onClick={() => open ? close() : setOpen(true)}>
      <ChatIcon name={open ? 'collapse' : 'chat'} size={25} />
    </button>

    <section id="admin-briefing-panel" className="book-chat-panel" role="dialog" aria-modal="false"
      aria-labelledby="admin-briefing-title" hidden={!open}>
      <header className="book-chat-header">
        <div className="book-chat-heading">
          <h2 id="admin-briefing-title">Trợ lý vận hành</h2>
          <p>Đơn hàng, tồn kho và danh mục</p>
        </div>
        {turns.length > 0 && <button type="button" className="book-chat-icon" disabled={busy}
          aria-label="Bắt đầu cuộc trò chuyện mới" title="Cuộc trò chuyện mới"
          onClick={() => { setTurns([]); setDraft(''); composer.current?.focus(); }}>
          <ChatIcon name="newChat" />
        </button>}
        <button ref={closeButton} type="button" className="book-chat-icon" aria-label="Đóng trợ lý vận hành" onClick={close}>
          <ChatIcon name="close" />
        </button>
      </header>

      <div ref={timeline} className="book-chat-timeline">
        {turns.length === 0 ? <div className="book-chat-welcome">
          <h3>Hôm nay cần xử lý gì trước?</h3>
          <div className="book-chat-prompts">
            <p>Gợi ý câu hỏi</p>
            {prompts.map(prompt => <button key={prompt} type="button" onClick={() => ask(prompt)}>
              <span>{prompt}</span><ChatIcon name="right" size={16} />
            </button>)}
          </div>
        </div> : <div role="log" aria-label="Trao đổi với trợ lý vận hành" aria-live="polite">
          {turns.map(({ question, topic, briefing, books, error }, index) => <div className="admin-briefing-turn" key={index}>
            <article className="book-chat-message user">
              <span className="book-chat-speaker">Bạn</span>
              <p className="book-chat-bubble">{question}</p>
            </article>
            {(briefing || books || error || !topic) && <article className="book-chat-message assistant">
              <span className="book-chat-speaker">Trợ lý vận hành</span>
              {briefing && <BriefingResult briefing={briefing} topic={topic} onNavigate={close} />}
              {books && <PriceResult books={books} onNavigate={close} />}
              {error && <div className="book-chat-error" role="alert">
                <p>{error}</p>
                {index === turns.length - 1 && <button type="button" disabled={busy} onClick={() => ask(question, true)}>Thử lại</button>}
              </div>}
              {!topic && <p className="book-chat-bubble">Bạn có thể hỏi về đơn chờ xác nhận, sách sắp hết, việc cần ưu tiên hoặc tối đa 20 đầu sách có giá cao nhất.</p>}
            </article>}
          </div>)}
        </div>}
        {busy && <p className="book-chat-thinking" role="status">
          <span className="book-chat-dots" aria-hidden="true"><i /><i /><i /></span> Đang kiểm tra số liệu…
        </p>}
      </div>

      <footer className="book-chat-composer">
        <form onSubmit={event => { event.preventDefault(); ask(draft); }}>
          <label className="sr-only" htmlFor="admin-briefing-input">Câu hỏi vận hành</label>
          <textarea id="admin-briefing-input" ref={composer} rows={1} maxLength={300}
            placeholder="Hỏi về đơn hàng, tồn kho hoặc giá sách…" value={draft} onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                ask(draft);
              }
            }} />
          <button type="submit" aria-label="Gửi câu hỏi" disabled={busy || !draft.trim()}><ChatIcon name="up" /></button>
        </form>
      </footer>
    </section>
  </div>;
}
