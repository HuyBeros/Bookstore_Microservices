import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * TailwindCheck: Trang tạm để xác nhận Tailwind CSS v4 đã hoạt động.
 * Truy cập: /dev/tailwind-check
 */
const TailwindCheck = () => {
  return (
    <div className="min-h-screen bg-slate-100 p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Tailwind CSS v4 Check</h1>

      {/* Test 1: bg-red-500 text-white p-4 rounded-xl */}
      <div className="bg-red-500 text-white p-4 rounded-xl font-semibold">
        ✅ Ô đỏ, chữ trắng, bo tròn - nếu thấy thì Tailwind đã chạy!
      </div>

      {/* Test 2: flex gap-4 with 3 boxes */}
      <div className="flex gap-4">
        <div className="bg-blue-500 text-white p-4 rounded-lg flex-1 text-center">Box 1</div>
        <div className="bg-green-500 text-white p-4 rounded-lg flex-1 text-center">Box 2</div>
        <div className="bg-purple-500 text-white p-4 rounded-lg flex-1 text-center">Box 3</div>
      </div>

      {/* Test 3: Responsive hidden/block */}
      <div>
        <div className="hidden md:block bg-amber-100 text-amber-800 p-4 rounded-lg">
          🖥️ Desktop only (hidden md:block) – chỉ hiện khi ≥768px
        </div>
        <div className="block md:hidden bg-pink-100 text-pink-800 p-4 rounded-lg">
          📱 Mobile only (block md:hidden) – chỉ hiện khi &lt;768px
        </div>
      </div>

      {/* Test 4: Lucide icon with className */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-indigo-600" />
        <span className="text-slate-700">Icon lucide với w-6 h-6 text-indigo-600</span>
      </div>
    </div>
  );
};

export default TailwindCheck;
