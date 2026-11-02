import AppRoutes from './routes/AppRoutes';
import MockBanner from './components/common/MockBanner';
import { ToastContainer } from './components/common/Toast';
import AppLoading from './components/system/AppLoading';
import TopProgressBar from './components/common/TopProgressBar';
import { useAuth } from './context/AuthContext';

function App() {
  const { loading } = useAuth();

  return (
    <>
      {/* Thanh 2px Terracotta ở mép trên cùng khi chuyển trang */}
      <TopProgressBar />

      {/* Ứng dụng chính */}
      <AppRoutes />

      {/* Màn chào lần tải đầu tiên (tự debounce 300ms, giữ min 400ms, fade-out 280ms) */}
      <AppLoading loading={loading} />

      <ToastContainer />
      <MockBanner />
    </>
  );
}

export default App;
