import React, { useEffect, useState, useRef } from 'react';

/**
 * AppLoading / AppSplashOverlay: Màn chào lần tải đầu tiên của Nhà sách Phương Anh
 * 
 * Quy tắc kỹ thuật & UX:
 * 1. Nền #fbf8f3 (màu giấy ấm cao cấp), chữ "P" Serif màu #c2410c ở giữa.
 * 2. Đường mảnh 1.5px chạy qua lại vô định (indeterminate), không dùng thanh % giả.
 * 3. Chỉ hiện khi tải quá 300ms (tránh nháy hình khi tải nhanh).
 * 4. Khi đã hiện thì giữ tối thiểu 400ms (tránh giật mắt).
 * 5. Khi tải xong thì fade-out nhanh trong 280ms, không dùng rèm kéo.
 * 6. prefers-reduced-motion: Chữ "P" tĩnh hoặc fade nhẹ, không có chuyển động chạy qua lại.
 * 7. Hỗ trợ aria-busy="true" và role="status" cho trình đọc màn hình.
 */
const AppLoading = ({ loading = true, onComplete }) => {
  // Trạng thái hiển thị: 'idle' | 'visible' | 'fading' | 'unmounted'
  const [phase, setPhase] = useState('idle');
  const visibleStartTimeRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 1. Debounce 300ms trước khi hiển thị màn chào
    const delayTimer = setTimeout(() => {
      if (loading) {
        visibleStartTimeRef.current = Date.now();
        setPhase('visible');
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!loading) {
      if (phase === 'idle') {
        // Tải xong nhanh hơn 300ms: kết thúc ngay lập tức, không hiện splash
        setPhase('unmounted');
        onComplete?.();
      } else if (phase === 'visible') {
        // Đã hiện lên màn hình: đảm bảo giữ tối thiểu 400ms để không giật mắt
        const elapsed = visibleStartTimeRef.current ? Date.now() - visibleStartTimeRef.current : 400;
        const remaining = Math.max(0, 400 - elapsed);

        const fadeTimer = setTimeout(() => {
          setPhase('fading');
          // Sau khi fade-out 280ms hoàn tất thì unmount
          const unmountTimer = setTimeout(() => {
            setPhase('unmounted');
            onComplete?.();
          }, 280);
          return () => clearTimeout(unmountTimer);
        }, remaining);

        return () => clearTimeout(fadeTimer);
      }
    }
  }, [loading, phase, onComplete]);

  // Nếu chưa quá 300ms hoặc đã unmount xong thì không render gì
  if (phase === 'idle' || phase === 'unmounted') {
    return null;
  }

  const isFading = phase === 'fading';

  return (
    <div
      role="status"
      aria-busy={loading}
      aria-label="Đang khởi tạo Nhà sách Phương Anh"
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#fbf8f3] select-none transition-opacity duration-300 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Monogram chữ P Serif chuẩn nhận diện Phương Anh */}
        <span
          className="font-serif font-semibold text-[#c2410c] tracking-tight leading-none select-none text-7xl sm:text-8xl"
          style={{
            fontFamily: 'var(--font-serif, "Lora", "Playfair Display", Georgia, serif)',
            fontSize: '5.25rem',
            lineHeight: 1,
          }}
        >
          P
        </span>

        {/* Đường mảnh 1.5px chạy qua lại vô định (indeterminate) */}
        <div className="w-32 sm:w-36 h-[1.5px] bg-[#eadecf] rounded-full overflow-hidden relative mt-6">
          <div
            className="absolute top-0 bottom-0 bg-[#c2410c] rounded-full animate-indeterminate-line motion-reduce:animate-none motion-reduce:left-[25%] motion-reduce:w-[50%]"
            aria-hidden="true"
          />
        </div>

        {/* Tên thương hiệu phụ trang nhã */}
        <p className="mt-5 font-serif text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#786b65] font-medium opacity-90">
          Nhà sách Phương Anh
        </p>

        {/* Thông báo ẩn cho trình đọc màn hình */}
        <p className="sr-only">Đang tải dữ liệu nhà sách, vui lòng chờ trong giây lát...</p>
      </div>
    </div>
  );
};

export default AppLoading;
