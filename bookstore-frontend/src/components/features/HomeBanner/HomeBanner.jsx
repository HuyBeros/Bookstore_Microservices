import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageCircle, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { SPOTLIGHT } from '../../../data/homeEditorial';
import { authorLabel } from '../../../utils/homeBooks';
import { openBookChat } from '../../../utils/chatEvents';
import './HomeBanner.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const SERVICES = [
  { Icon: Truck, title: 'Miễn phí giao hàng', detail: 'Cho đơn từ 250.000₫' },
  { Icon: ShieldCheck, title: 'Sách chính hãng', detail: 'An tâm chọn sách cho mình' },
  { Icon: RotateCcw, title: 'Đổi trả trong 7 ngày', detail: 'Hỗ trợ khi sách có lỗi' },
];

export default function HomeBanner({ book, topics }) {
  const [failedCover, setFailedCover] = useState(null);
  const author = authorLabel(book);
  const detailUrl = book ? `/books/${book.id}` : '/books';
  const selected = book?.title?.toLocaleLowerCase('vi').includes(SPOTLIGHT.title.toLocaleLowerCase('vi'));
  const cover = book?.coverUrl || book?.image;

  return <section className="home-banner" aria-labelledby="home-hero-title">
    <div className="home-banner-grid">
      <div className="home-banner-copy">
        <p className="home-banner-kicker">Mỗi trang sách, một chân trời</p>
        <h1 id="home-hero-title" className="home-banner-heading">Khơi nguồn tri thức,{' '}<span>nuôi dưỡng tâm hồn.</span></h1>
        <p className="home-banner-intro">Khám phá những cuốn sách đáng đọc, từ văn học đến tri thức đời sống. Tìm một góc nhìn mới, một câu chuyện hay và cảm hứng cho mỗi ngày.</p>
        <div className="home-banner-actions">
          <Link to="/books" className="home-banner-explore">Khám phá sách <ArrowRight size={17} aria-hidden="true" /></Link>
          <button type="button" className="home-banner-ai" aria-haspopup="dialog" aria-controls="book-chat-panel" onClick={event => openBookChat(event.currentTarget)}>
            <MessageCircle size={17} aria-hidden="true" /><span>Hỏi AI chọn sách giúp bạn</span>
          </button>
        </div>
        {topics.length > 0 && <nav className="home-banner-topics" aria-label="Duyệt sách theo chủ đề">
          <p>Duyệt theo chủ đề</p>
          <div>{topics.map(topic => <Link key={topic.id} to={`/books?categoryId=${topic.id}`} className="home-banner-topic">{topic.label}</Link>)}</div>
        </nav>}
      </div>

      <article className="home-banner-feature" aria-label="Tác phẩm tuyển chọn">
        <header className="home-banner-feature-heading"><span>Phương Anh chọn đọc</span></header>
        <Link to={detailUrl} className="home-banner-book-stage" aria-label={book ? `Xem sách ${book.title}` : 'Khám phá tác phẩm tuyển chọn'}>
          {book && cover && failedCover !== cover ? <span className="home-banner-book">
            <img src={cover} alt={`Bìa sách ${book.title}`} width="400" height="600" fetchPriority="high" decoding="async" onError={() => setFailedCover(cover)} />
          </span> : <span className="home-banner-book-placeholder"><BookOpen size={64} strokeWidth={1.2} aria-hidden="true" /></span>}
        </Link>
        <div className="home-banner-book-info">
          <p className="home-banner-category">{book?.category?.name || 'Một cuốn sách cho bạn'}</p>
          <Link to={detailUrl}><h2 title={book?.title}>{book?.title || 'Tìm câu chuyện tiếp theo của bạn'}</h2></Link>
          {book && <p className="home-banner-author" title={author.full}>{author.short}</p>}
          <p className="home-banner-note">{selected ? SPOTLIGHT.note : 'Khám phá danh mục và chọn cuốn sách phù hợp với sở thích của bạn.'}</p>
          <footer className="home-banner-book-footer">
            {book && <span className="home-banner-price">{money.format(book.price)}</span>}
            <Link to={detailUrl} className="home-banner-detail">Xem chi tiết <ArrowRight size={16} aria-hidden="true" /></Link>
          </footer>
        </div>
      </article>
    </div>

    <div className="home-assurance-bar">
      <ul className="home-assurances" aria-label="Dịch vụ của nhà sách">
        {SERVICES.map(({ Icon, title, detail }) => <li key={title}>
          <span className="home-assurance-icon"><Icon size={29} strokeWidth={1.5} aria-hidden="true" /></span>
          <div><strong>{title}</strong><p>{detail}</p></div>
        </li>)}
        <li>
          <button type="button" className="home-assurance-ai" aria-label="AI tư vấn sách, mở chatbot" aria-haspopup="dialog" aria-controls="book-chat-panel" onClick={event => openBookChat(event.currentTarget)}>
            <span className="home-assurance-icon"><MessageCircle size={29} strokeWidth={1.5} aria-hidden="true" /></span>
            <span className="home-assurance-copy"><strong>AI tư vấn sách</strong><span className="home-assurance-detail">Gợi ý theo sở thích của bạn</span></span>
            <ArrowRight size={17} className="home-assurance-arrow" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </div>
  </section>;
}
