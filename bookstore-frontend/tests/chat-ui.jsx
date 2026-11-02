// Isolated browser QA: real widget and AuthProvider, deterministic mock API only.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { mockApi } from '../src/mock/mockApi';
import ChatWidget from '../src/components/features/ChatWidget/ChatWidget';
import '../src/index.css';

let mode = 'success';
let lastRequest = null;
const fixture = { id: 900001, username: 'chat-ui-test', role: 'CUSTOMER', fullName: 'Bạn đọc kiểm thử' };
const enabled = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';
if (enabled) {
  mockApi.login = async () => ({ token: 'mock-chat-ui-only', user: fixture });
  mockApi.getMe = async () => fixture;
  mockApi.logout = async () => ({});
  mockApi.chatWithAI = async request => {
    lastRequest = request;
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (mode === 'error') throw { status: 503 };
    if (mode === 'limit') throw { status: 429 };
    return { answer: 'Mình gợi ý bạn bắt đầu từ một cuốn sách phù hợp với sở thích.\nBạn có thể xem thông tin sách bên dưới.',
      books: [{ id: 25, title: 'Cuốn sách dành cho bạn', price: 70000, stock: 1 },
        { id: 26, title: 'Một câu chuyện để khám phá', price: 85000, stock: null }],
      sources: [{ bookId: 25, title: 'Cuốn sách dành cho bạn', url: '/books/25' },
        { bookId: 26, title: 'Một câu chuyện để khám phá', url: '/books/26' }],
      notices: ['Chưa xác minh được tồn kho của một số sách. Vui lòng kiểm tra tại trang sách.'],
      degraded: mode === 'degraded' };
  };
}
export function Harness() {
  const { login, logout, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('success');
  const [request, setRequest] = useState(null);
  return <>
    <main className="mx-auto max-w-3xl space-y-6 p-6" style={{ minHeight: '220vh' }}>
      <h1 className="font-serif">Nhà sách Phương Anh</h1>
      <p>Kiểm tra giao diện chat với dữ liệu mô phỏng, không gọi backend.</p>
      <div className="flex flex-wrap gap-6">
        <button onClick={() => isAuthenticated ? logout() : login('fixture', 'fixture')}>{isAuthenticated ? 'Đăng xuất kiểm thử' : 'Đăng nhập kiểm thử'}</button>
        <label>Phản hồi <select aria-label="Chế độ phản hồi" value={status} onChange={event => { mode = event.target.value; setStatus(mode); }}>
          <option value="success">Thành công</option><option value="error">Lỗi kết nối</option><option value="limit">Quá giới hạn</option><option value="degraded">AI gián đoạn</option>
        </select></label>
        <button onClick={() => setRequest(lastRequest)}>Xem request gần nhất</button>
      </div>
      <pre className="whitespace-pre-wrap text-xs" aria-label="Request gửi đến AI">{JSON.stringify(request, null, 2)}</pre>
      <Link to="/tests/chat-ui.html?route=next">Đổi trang kiểm thử</Link>
    </main>
    <ChatWidget />
    <nav className="fixed bottom-0 flex h-16 w-full items-center justify-center border-t bg-white md:hidden">Thanh điều hướng điện thoại</nav>
  </>;
}
createRoot(document.getElementById('root')).render(enabled
  ? <BrowserRouter><AuthProvider><Harness /></AuthProvider></BrowserRouter>
  : <p>Chỉ mở harness ở Vite dev với VITE_USE_MOCK=true.</p>);
