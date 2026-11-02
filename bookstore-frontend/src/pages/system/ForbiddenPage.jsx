import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * ForbiddenPage: trang 403
 */
const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    document.title = 'Không có quyền truy cập - Quản lý sách';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white">
      <div className="text-center max-w-md">
        <Lock size={64} className="text-red-500 mx-auto mb-6" />

        <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Không có quyền truy cập</h2>

        <p className="text-gray-600 mb-8">
          Bạn không có quyền để truy cập trang này. Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ
          quản trị viên.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {isAuthenticated ? (
            <>
              <Button
                variant="primary"
                onClick={() =>
                  user?.role === 'ADMIN' || user?.role === 'STAFF'
                    ? navigate('/admin')
                    : navigate('/')
                }
              >
                Về trang chủ
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>
                Quay lại
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
