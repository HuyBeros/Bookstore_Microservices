import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  Sparkles,
  Users,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

/**
 * AboutPage — Pure White Editorial About Page for BookZone
 * Matches the Figma design aesthetic: refined typography, terracotta accents, spacious layout.
 */
const AboutPage = () => {
  const milestones = [
    { year: '2020', title: 'Khởi đầu hành trình', desc: 'Ra mắt với mong muốn tạo dựng một không gian thưởng thức sách trực tuyến nguyên bản và chuẩn mực.' },
    { year: '2022', title: 'Đạt mốc 50,000 đầu sách', desc: 'Hợp tác chính thức với hơn 60 nhà xuất bản và đơn vị phát hành sách uy tín hàng đầu trong và ngoài nước.' },
    { year: '2024', title: 'Cộng đồng 120,000 độc giả', desc: 'Xây dựng mạng lưới kết nối những người yêu sách, câu lạc bộ đọc sách và các ấn phẩm giới hạn.' },
    { year: '2026', title: 'Định hình văn hóa đọc mới', desc: 'Tiếp tục sứ mệnh mang tri thức tinh hoa đến gần hơn với từng gia đình và thế hệ độc giả trẻ.' },
  ];

  const coreValues = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#9b2f00]" />,
      title: '100% Bản quyền nguyên bản',
      desc: 'Mọi ấn phẩm tại Phương Anh đều được phân phối chính ngạch từ các NXB uy tín: Trẻ, Kim Đồng, Nhã Nam, First News...',
    },
    {
      icon: <Award className="w-6 h-6 text-[#9b2f00]" />,
      title: 'Tuyển chọn chất lượng cao',
      desc: 'Hội đồng biên tập chọn lọc kỹ lưỡng từng tựa sách, chú trọng cả giá trị tư tưởng lẫn chất lượng hoàn thiện bản in.',
    },
    {
      icon: <Truck className="w-6 h-6 text-[#9b2f00]" />,
      title: 'Đóng gói bảo quản 3 lớp',
      desc: 'Mỗi cuốn sách được bọc chống sốc kỹ càng, chống móp méo góc bìa, giao đến tay bạn trong tình trạng hoàn hảo.',
    },
    {
      icon: <RotateCcw className="w-6 h-6 text-[#9b2f00]" />,
      title: 'Đổi trả miễn phí 7 ngày',
      desc: 'Thủ tục đổi trả nhanh chóng và chu đáo nếu sách có bất kỳ lỗi in ấn hay hư hại nào trong quá trình vận chuyển.',
    },
  ];

  const publishers = [
    'NXB Trẻ',
    'NXB Kim Đồng',
    'Nhã Nam',
    'First News - Trí Việt',
    'NXB Phụ Nữ',
    'NXB Thế Giới',
    'NXB Văn Học',
    'Alpha Books',
  ];

  return (
    <div className="bg-white min-h-screen text-[#121c2a]">
      {/* ─── Breadcrumb ────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-[#786b65]">
          <Link to="/" className="hover:text-[#9b2f00] no-underline">Trang chủ</Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="font-semibold text-[#121c2a]">Giới thiệu Phương Anh</span>
        </div>
      </div>

      {/* ─── Hero Section ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-[#9b2f00] px-3 py-1 rounded-full bg-[#ffece7] border border-[#ffdcc3]">
              HÀNH TRÌNH TRI THỨC PHƯƠNG ANH
            </span>
            <h1 className="font-playfair font-bold text-3xl sm:text-5xl lg:text-6xl text-[#121c2a] leading-[1.2] tracking-tight">
              Nơi khởi nguồn tri thức, nuôi dưỡng tâm hồn qua từng trang sách.
            </h1>
            <p className="text-sm sm:text-base text-[#59413a] leading-relaxed font-normal">
              Phương Anh được sinh ra với một niềm tin thuần khiết: Mỗi cuốn sách là một thế giới mở ra tầm nhìn mới. Chúng tôi xây dựng một nền tảng văn hóa đọc chuẩn mực, kết nối độc giả với những tác phẩm trường tồn theo năm tháng.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Core Values ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-gray-100 bg-gray-50/40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9b2f00]">
              CAM KẾT VỮNG BỀN
            </span>
            <h2 className="font-playfair font-bold text-2xl sm:text-4xl text-[#121c2a]">
              Giá Trị Cốt Lõi Tại Phương Anh
            </h2>
            <p className="text-xs sm:text-sm text-[#786b65]">
              Sự hài lòng và trải nghiệm đọc trọn vẹn của bạn là thước đo cao nhất cho từng nỗ lực của đội ngũ chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((v, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-2xs space-y-3 transition-all hover:shadow-md hover:border-[#ffdcc3]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ffece7] flex items-center justify-center">
                  {v.icon}
                </div>
                <h3 className="font-sans font-bold text-base text-[#121c2a]">
                  {v.title}
                </h3>
                <p className="text-xs text-[#59413a] leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Milestone Timeline ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9b2f00]">
              LỊCH SỬ PHÁT TRIỂN
            </span>
            <h2 className="font-playfair font-bold text-2xl sm:text-4xl text-[#121c2a]">
              Từng Bước Đi Cùng Độc Giả
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-[#ffdcc3] space-y-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#9b2f00]" />
                <span className="font-playfair font-bold text-2xl text-[#9b2f00]">
                  {m.year}
                </span>
                <h4 className="font-sans font-bold text-sm text-[#121c2a]">
                  {m.title}
                </h4>
                <p className="text-xs text-[#59413a] leading-relaxed">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Publisher Partners ─────────────────────────────────────── */}
      <section className="py-14 bg-gray-50/50 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#786b65]">
            ĐỐI TÁC XUẤT BẢN ĐỒNG HÀNH
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {publishers.map((pub, idx) => (
              <span
                key={idx}
                className="px-4 py-2 rounded-xl bg-white border border-[#e5e7eb] text-xs font-semibold text-[#4a3e39] shadow-2xs"
              >
                {pub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact & Support ──────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#ffece7]/40 border border-[#ffdcc3] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9b2f00]">
                LIÊN HỆ VỚI CHÚNG TÔI
              </span>
              <h3 className="font-playfair font-bold text-2xl sm:text-3xl text-[#121c2a]">
                Bạn có câu hỏi hoặc cần tư vấn chọn sách?
              </h3>
              <p className="text-xs sm:text-sm text-[#59413a]">
                Đội ngũ chăm sóc độc giả Phương Anh luôn sẵn sàng hỗ trợ 24/7 để mang đến trải nghiệm hài lòng nhất.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="tel:19006868"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-[#c2410c] hover:bg-[#9b2f00] text-white transition-all shadow-xs no-underline"
              >
                <Phone size={16} />
                <span>Hotline 1900 6868</span>
              </a>
              <Link
                to="/books"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-white hover:bg-gray-50 text-[#9b2f00] border border-[#ffdcc3] transition-all no-underline"
              >
                <BookOpen size={16} />
                <span>Khám phá kho sách</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
