import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';

/**
 * ServerErrorPage: trang 500
 */
const ServerErrorPage = () => {
  useEffect(() => {
    document.title = 'Lỗi máy chủ - Quản lý sách';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white">
      <div className="text-center max-w-md">
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />

        <h1 className="text-4xl font-bold text-gray-900 mb-2">500</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Lỗi máy chủ nội bộ</h2>

        <p className="text-gray-600 mb-8">
          Máy chủ gặp sự cố không mong muốn. Chúng tôi đang cố gắng khắc phục sự cố này.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Tải lại trang
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              window.history.back();
            }}
          >
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
