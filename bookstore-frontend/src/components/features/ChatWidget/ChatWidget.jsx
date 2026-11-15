import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { chatWithAI } from '../../../api/services/aiApi';
import { OPEN_BOOK_CHAT } from '../../../utils/chatEvents';
import ChatIcon from './ChatIcon';
import './ChatWidget.css';

const PROMPTS = ['Tìm sách để bắt đầu thói quen đọc', 'Gợi ý một cuốn tiểu thuyết', 'Tìm sách về kinh tế'];
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function stockLabel(stock) {
  if (!Number.isInteger(stock) || stock < 0) return 'Chưa xác minh tồn kho';
  if (stock === 0) return 'Hiện hết hàng';
  if (stock <= 3) return `Chỉ còn ${stock} cuốn`;
  return 'Còn hàng';
}

function BookSuggestion({ book, onSelect }) {
  const [failedCover, setFailedCover] = useState(null);
  const cover = typeof book.coverUrl === 'string' ? book.coverUrl.trim() : '';
  const hasCover = cover && cover !== failedCover;
  const hasPrice = book.price != null && Number.isFinite(Number(book.price));

  return <li>
    <Link className={`book-chat-book${hasCover ? ' has-cover' : ''}`} to={`/books/${book.id}`} onClick={onSelect}>
      {hasCover ? <>
        <img src={cover} alt="" width="44" height="64" loading="lazy" decoding="async" onError={() => setFailedCover(cover)} />
        <span className="book-chat-book-copy">
          <strong>{book.title}</strong>
          <span className="book-chat-book-meta">
            {hasPrice && <span className="book-chat-price">{money.format(Number(book.price))}</span>}
            <span className={`book-chat-stock${book.stock === 0 ? ' unavailable' : ''}`}>{stockLabel(book.stock)}</span>
          </span>
        </span>
        <ChatIcon name="right" size={16} />
      </> : <span>{book.title}</span>}
    </Link>
  </li>;
}

function BackToTop({ hidden }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 400);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  if (!visible || hidden) return null;
  return <button type="button" className="book-chat-top" aria-label="Lên đầu trang" title="Lên đầu trang"
    onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>
    <ChatIcon name="up" />
  </button>;
}

function ChatSession({ authenticated }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const launcher = useRef(null);
  const composer = useRef(null);
  const timeline = useRef(null);
  const closeButton = useRef(null);
  const lastTrigger = useRef(null);
  const sending = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const reveal = event => { lastTrigger.current = event.detail?.trigger ?? launcher.current; setOpen(true); };
    window.addEventListener(OPEN_BOOK_CHAT, reveal);
    return () => window.removeEventListener(OPEN_BOOK_CHAT, reveal);
  }, []);
  useEffect(() => {
    if (!open) return;
    // Avoid opening the software keyboard just by opening chat on a phone.
    if (authenticated && window.matchMedia('(pointer: fine)').matches) composer.current?.focus();
    else closeButton.current?.focus();
    const onKey = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        setConfirmReset(false);
        (lastTrigger.current?.isConnected ? lastTrigger.current : launcher.current)?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, authenticated]);
  useEffect(() => {
    const list = timeline.current;
    if (!open || !list) return;
    const bottom = list.scrollHeight - list.clientHeight;
    const latestReply = !busy && !failure && list.querySelector('.book-chat-message.assistant:last-child');
    list.scrollTop = latestReply ? Math.min(bottom, latestReply.offsetTop - 16) : bottom;
  }, [messages, busy, failure, open]);

  const close = () => {
    setOpen(false);
    setConfirmReset(false);
    (lastTrigger.current?.isConnected ? lastTrigger.current : launcher.current)?.focus();
  };
  const send = async (text = draft, retry = false) => {
    const content = text.trim();
    if (!authenticated || sending.current || !content || content.length > 2000) return;
    sending.current = true;
    setBusy(true);
    setFailure(null);
    setConfirmReset(false);
    if (!retry) {
      setDraft('');
      setMessages(previous => [...previous, { role: 'user', content }]);
    }
    // Match AdviceRequest: ten previous turns, at most 2,000 characters each.
    const history = (retry ? messages.slice(0, -1) : messages).slice(-10).map(turn => ({
      role: turn.role.toUpperCase(), content: (turn.content.slice(0, 1200) + (turn.role === 'assistant' && turn.books?.length
        ? '\nSách đã hiển thị: ' + turn.books.slice(0, 3).map(book => `[book:${book.id}] ${book.title}`).join('; ') : '')).slice(0, 2000),
    }));
    try {
      const response = await chatWithAI({ message: content, history, limit: 3 });
      const data = response?.data ?? response;
      const answer = data?.answer ?? data?.reply ?? data?.message;
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty answer');
      if (mounted.current) setMessages(previous => [...previous, {
        role: 'assistant', content: answer, books: Array.isArray(data.books) ? data.books : [], degraded: data.degraded === true,
        notices: Array.isArray(data.notices) ? data.notices.filter(note => typeof note === 'string') : [],
        sources: Array.isArray(data.sources) ? data.sources : [],
      }]);
    } catch (error) {
      if (mounted.current) setFailure({ text: content, message: error?.status === 429
        ? 'Bạn đang gửi hơi nhanh. Hãy đợi một chút rồi thử lại.'
        : 'Chưa thể nhận câu trả lời. Bạn có thể thử lại sau ít phút.' });
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const loginUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  return <div className="book-chat-tools">
    <BackToTop hidden={open} />
    <button ref={launcher} type="button" className="book-chat-launcher"
      aria-label={open ? 'Thu gọn trợ lý sách' : 'Mở trợ lý tư vấn sách'} aria-expanded={open}
      aria-haspopup="dialog" aria-controls="book-chat-panel" title={open ? 'Thu gọn trợ lý sách' : 'Trợ lý tư vấn sách'}
      onClick={event => { lastTrigger.current = event.currentTarget; if (open) close(); else setOpen(true); }}>
      <ChatIcon name={open ? 'collapse' : 'chat'} size={25} />
    </button>
    <section id="book-chat-panel" className="book-chat-panel" role="dialog" aria-modal="false"
      aria-labelledby="book-chat-title" hidden={!open}>
      <header className="book-chat-header">
        <div className="book-chat-heading">
          <h2 id="book-chat-title">Bạn đọc cùng Phương Anh</h2>
          <p>Tư vấn sách với AI</p>
        </div>
        {messages.length > 0 && <button type="button" className="book-chat-icon" disabled={busy}
          aria-label="Bắt đầu cuộc trò chuyện mới" title="Cuộc trò chuyện mới" onClick={() => setConfirmReset(value => !value)}>
          <ChatIcon name="newChat" />
        </button>}
        <button ref={closeButton} type="button" className="book-chat-icon" aria-label="Đóng khung chat" title="Đóng" onClick={close}><ChatIcon name="close" /></button>
      </header>
      {confirmReset && <div className="book-chat-reset">
        <p>Bắt đầu lại và xóa nội dung cuộc trò chuyện này?</p>
        <div>
          <button type="button" onClick={() => { setMessages([]); setFailure(null); setConfirmReset(false); composer.current?.focus(); }}>Bắt đầu lại</button>
          <button type="button" onClick={() => setConfirmReset(false)}>Giữ cuộc trò chuyện</button>
        </div>
      </div>}
      <div className="book-chat-timeline" ref={timeline}>
        {messages.length === 0 && <div className="book-chat-welcome">
          <h3>Bạn muốn đọc gì tiếp theo?</h3>
          <p>Cho mình biết chủ đề, tác giả hoặc tầm giá bạn quan tâm.</p>
          {authenticated ? <div className="book-chat-prompts">
            <p>Gợi ý câu hỏi</p>
            {PROMPTS.map(prompt => <button type="button" key={prompt} onClick={() => send(prompt)} disabled={busy}><span>{prompt}</span><ChatIcon name="right" size={16} /></button>)}
          </div> : <div className="book-chat-signin">
            <Link to={loginUrl} onClick={close}>Đăng nhập để trò chuyện <ChatIcon name="right" size={16} /></Link>
            <Link to="/books" onClick={close} className="book-chat-browse">Khám phá kho sách</Link>
          </div>}
        </div>}
        <div role="log" aria-label="Nội dung trò chuyện" aria-live="polite" aria-relevant="additions text">
          {messages.map((message, index) => {
            const books = message.books?.filter(book => Number.isSafeInteger(Number(book?.id)) && Number(book.id) > 0).slice(0, 3);
            const catalogSource = message.sources?.some(source => books?.some(book => Number(book.id) === Number(source.bookId)));
            return <article key={index} className={`book-chat-message ${message.role}`}>
              <span className="book-chat-speaker">{message.role === 'user' ? 'Bạn' : 'Phương Anh'}</span>
              <p className="book-chat-bubble">{message.content}</p>
              {message.degraded && <p className="book-chat-fallback">Kết quả tham khảo từ danh mục, chưa có tư vấn AI hoàn chỉnh.</p>}
              {message.notices?.map((notice, noteIndex) => <p key={noteIndex} className="book-chat-fallback">{notice}</p>)}
              {books?.length > 0 && <div className="book-chat-recommendations">
                <p>{catalogSource ? 'Gợi ý từ danh mục nhà sách' : 'Sách gợi ý'}</p>
                <ul>{books.map(book => <BookSuggestion key={book.id} book={book} onSelect={close} />)}</ul>
              </div>}
            </article>;
          })}
        </div>
        {busy && <div className="book-chat-thinking" role="status"><span className="book-chat-dots"><i /><i /><i /></span> Đang tìm gợi ý cho bạn…</div>}
        {failure && <div className="book-chat-error" role="alert"><p>{failure.message}</p><button type="button" onClick={() => send(failure.text, true)}>Thử lại</button></div>}
      </div>
      {authenticated && <footer className="book-chat-composer">
        <form onSubmit={event => { event.preventDefault(); send(); }}>
          <label className="sr-only" htmlFor="book-chat-input">Tin nhắn cho trợ lý sách</label>
          <textarea id="book-chat-input" ref={composer} rows={1} value={draft} maxLength={2000} placeholder="Nhập câu hỏi về sách…"
            aria-describedby="book-chat-hint" disabled={busy || !!failure} onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
            }} />
          <button type="submit" disabled={busy || !!failure || !draft.trim()} aria-label="Gửi tin nhắn" title="Gửi tin nhắn"><ChatIcon name="up" /></button>
        </form>
        {failure && <button type="button" className="book-chat-dismiss" onClick={() => {
          setDraft(failure.text); setMessages(previous => previous.slice(0, -1)); setFailure(null);
        }}>Chỉnh sửa câu hỏi</button>}
        <p id="book-chat-hint">AI có thể nhầm. Kiểm tra giá và tồn kho tại trang sách.</p>
      </footer>}
    </section>
  </div>;
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  // Reset in-memory conversations on account changes; never save them in localStorage.
  return <ChatSession key={isAuthenticated ? String(user?.id ?? user?.username ?? 'signed-in') : 'guest'} authenticated={isAuthenticated} />;
}
