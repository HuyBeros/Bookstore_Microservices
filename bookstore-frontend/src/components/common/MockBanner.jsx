import React, { useState } from 'react';
import { Database, RotateCcw, X, ShieldAlert } from 'lucide-react';
import { isMockEnabled } from '../../api/request';
import { resetMockDb } from '../../mock/db';
import { useToast } from '../../context/ToastContext';

/**
 * MockBanner: Dải thông báo trạng thái Mock Data cố định đáy màn hình (chỉ hiện ở dev mode)
 */
const MockBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { showToast } = useToast();

  if (!isMockEnabled() || dismissed) return null;

  const handleReset = () => {
    resetMockDb();
    showToast({
      type: 'success',
      message: 'Đã khôi phục dữ liệu mẫu giả lập về ban đầu!',
    });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-gray-950 px-3 py-1.5 text-xs font-semibold shadow-lg flex items-center justify-between border-t border-amber-600/30">
      <div className="flex items-center gap-2">
        <Database size={15} className="animate-pulse" />
        <span>
          Đang chạy chế độ <strong>Mock Data (Dữ liệu giả lập)</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="px-2.5 py-0.5 rounded bg-gray-900 text-amber-300 hover:bg-black transition flex items-center gap-1 text-[11px]"
          title="Khôi phục lại dữ liệu ban đầu"
        >
          <RotateCcw size={12} />
          Reset dữ liệu
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-600 rounded text-gray-950 transition"
          aria-label="Đóng thông báo"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default MockBanner;

