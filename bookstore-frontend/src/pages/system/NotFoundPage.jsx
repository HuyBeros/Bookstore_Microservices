import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * NotFoundPage: trang 404
 */
const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Trang không tìm thấy - Quản lý sách';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white">
      <div className="text-center max-w-md">
        <Search size={64} className="text-gray-400 mx-auto mb-6" />

        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Trang không tìm thấy</h2>

        <p className="text-gray-600 mb-8">
          Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
          {user?.role === 'ADMIN' || user?.role === 'STAFF' ? (
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              Về dashboard
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
