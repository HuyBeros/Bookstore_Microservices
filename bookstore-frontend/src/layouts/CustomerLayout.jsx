import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, Home, BookOpen, ClipboardList, Search, Heart, ChevronDown, ChevronRight, Mail } from 'lucide-react';
import { ErrorBoundary } from '../components/ui';
import { bookApi } from '../api/services';
import { updateBookQuery } from '../api/bookQuery';
import { useRouteDisclosure } from '../hooks/useRouteDisclosure';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import LiteraryQuote from '../components/common/LiteraryQuote';
import ChatWidget from '../components/features/ChatWidget/ChatWidget';

/**
 * CustomerLayout: Pure White Editorial Minimalist Layout
 * Features:
 * - Symmetrically balanced 3-column header (Left Wings = Right Wings, Center = Dead Center Search)
 * - Clean navigation (Trang chủ, Giới thiệu) — removed AI Advisor and Night Mode per Figma spec
 * - Level-2 Mega Menu for categories
 * - Pure white background (#ffffff) across all screens
 */
const CustomerLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useRouteDisclosure(location.key);
  const [mobileSearchOpen, setMobileSearchOpen] = useRouteDisclosure(location.key);
  const [categoryMenuOpen, setCategoryMenuOpen] = useRouteDisclosure(location.key);
  const [activeMegaCat, setActiveMegaCat] = useState('categories');
  const [mobileExpandedCat, setMobileExpandedCat] = useState('categories');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [headerDraft, setHeaderDraft] = useState({ key: null, value: '' });
  const [menuFacets, setMenuFacets] = useState(null);
  const searchRef = useRef(null);

  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const headerSearch = headerDraft.key === location.search ? headerDraft.value : new URLSearchParams(location.search).get('q') ?? '';
  const navigate = useNavigate();

  // Enforce pure white light mode permanently
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('darkMode');
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K focuses header search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => bookApi.getBookFilters({}, { signal: controller.signal })
      .then(setMenuFacets).catch(() => {});
    refresh();
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [location.pathname]);

  const handleSearch = (query) => {
    const params = updateBookQuery(location.pathname === '/books' ? location.search : '', { q: query.trim() });
    navigate(`/books?${params}`);
    setMobileSearchOpen(false);
    setCategoryMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      alert('Cảm ơn bạn đã đăng ký nhận bản tin văn hóa của Phương Anh!');
      setNewsletterEmail('');
    }
  };

  const isNavActive = (linkTo) => {
    if (linkTo === '/') {
      return location.pathname === '/' && !location.search;
    }
    const [targetPath, targetQuery] = linkTo.split('?');
    if (location.pathname !== targetPath) return false;
    if (!targetQuery) return !location.search || location.search === '';
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(targetQuery);
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  const megaCategories = [
    { id: 'categories', name: 'Danh mục thể loại', link: '/books', options: menuFacets?.categories ?? [], param: 'categoryId' },
    { id: 'publishers', name: 'Nhà xuất bản', link: '/books', options: menuFacets?.publishers ?? [], param: 'publisherId' },
    { id: 'authors', name: 'Tác giả', link: '/books', options: menuFacets?.authors ?? [], param: 'authorId' },
  ].map(group => ({ ...group, subItems: group.options.filter(option => option.count > 0 && option.name.replace(/&nbsp;|&#160;/g, ' ').trim()).map(option => ({
    title: option.name, link: `/books?${group.param}=${option.id}`, badge: String(option.count),
  })) }));
  const navLinks = [
    { label: 'Sách bán chạy', to: '/bestsellers' },
    { label: 'Sách mới', to: '/books?sort=newest' },
  ];
  const footerExploreLinks = (menuFacets?.categories ?? []).filter(option => option.count > 0).slice(0, 6)
    .map(option => ({ label: option.name, to: `/books?categoryId=${option.id}` }));

  const footerSupportLinks = [
    { label: 'Giới thiệu về Phương Anh', to: '/about' },
    { label: 'Chính sách giao hàng toàn quốc', to: '/shipping-policy' },
    { label: 'Đổi trả trong 7 ngày', to: '/return-policy' },
    { label: 'Hướng dẫn đặt hàng', to: '/order-guide' },
    { label: 'Tra cứu tiến độ đơn hàng', to: '/orders' },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white text-[#121c2a] font-body transition-colors">

        {/* ===== STICKY HEADER (BookZone: Pure White Minimalist Symmetrically Balanced) ===== */}
        <header className="sticky top-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3 lg:gap-4">

            {/* Left Section: Brand Logo & Level-2 Danh mục Button */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <Link
                to="/"
                className="flex flex-col justify-center shrink-0 no-underline hover:no-underline group"
              >
                <span className="font-playfair font-bold text-2xl sm:text-[26px] tracking-tight text-[#9b2f00] leading-none transition-colors group-hover:text-[#7a2500]">
                  Phương Anh
                </span>
                <span className="text-[10px] tracking-wider uppercase text-[#786b65] font-semibold mt-1">
                  Nhà sách trực tuyến
                </span>
              </Link>

              {/* Level-2 Mega Menu Trigger (Desktop): "Danh mục" button */}
              <div
                className="relative hidden md:block shrink-0"
                onMouseLeave={() => setCategoryMenuOpen(false)}
              >
                <button
                  type="button"
                  aria-expanded={categoryMenuOpen}
                  aria-controls="catalog-mega-menu"
                  onKeyDown={event => { if (event.key === 'Escape') setCategoryMenuOpen(false); }}
                  onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                  className={`h-10 flex items-center gap-2 px-3.5 rounded-xl text-sm font-semibold transition-all shadow-2xs border ${
                    categoryMenuOpen
                      ? 'text-white bg-[#9b2f00] border-[#9b2f00]'
                      : 'text-[#4a3e39] bg-white hover:bg-[#ffece7]/60 hover:text-[#9b2f00] border-gray-200'
                  }`}
                >
                  <Menu size={16} strokeWidth={2} />
                  <span>Danh mục</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${categoryMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Level-2 Mega Menu Dropdown */}
                {categoryMenuOpen && (
                  <div id="catalog-mega-menu" className="absolute left-0 top-full pt-2 z-50 animate-fade-in">
                    <div className="w-[680px] lg:w-[740px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#e5e7eb] flex overflow-hidden">
                      {/* Level 1 (Left Sidebar) */}
                      <div className="w-48 lg:w-52 bg-gray-50/50 border-r border-[#e5e7eb] py-3 px-2 space-y-1 shrink-0">
                        {megaCategories.map((cat) => {
                          const isActive = activeMegaCat === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onMouseEnter={() => setActiveMegaCat(cat.id)}
                              aria-pressed={isActive}
                              onClick={() => setActiveMegaCat(cat.id)}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${
                                isActive
                                  ? 'bg-[#9b2f00] text-white shadow-xs'
                                  : 'text-[#4a3e39] hover:bg-white hover:text-[#9b2f00]'
                              }`}
                            >
                              <span>{cat.name}</span>
                              <ChevronRight size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Level 2 (Right Content Sub-items) */}
                      <div className="flex-1 p-5 bg-white">
                        <div className="mb-3.5 pb-2 border-b border-[#e5e7eb] flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#9b2f00]">
                            {megaCategories.find(c => c.id === activeMegaCat)?.name}
                          </span>
                          <Link
                            to={megaCategories.find(c => c.id === activeMegaCat)?.link || '/books'}
                            onClick={() => setCategoryMenuOpen(false)}
                            className="text-xs text-[#786b65] hover:text-[#9b2f00] flex items-center gap-1 font-semibold no-underline"
                          >
                            <span>Xem toàn bộ</span>
                            <ChevronRight size={12} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {megaCategories.find(c => c.id === activeMegaCat)?.subItems.map((sub, idx) => (
                            <Link
                              key={idx}
                              to={sub.link}
                              onClick={() => setCategoryMenuOpen(false)}
                              className="px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-medium text-[#4a3e39] hover:text-[#9b2f00] hover:bg-[#ffece7]/40 border border-[#e5e7eb] hover:border-[#ffdcc3] transition-all no-underline flex items-center justify-between group"
                            >
                              <span className="truncate">{sub.title}</span>
                              {sub.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#ffece7] text-[#c2410c] font-bold shrink-0 ml-1.5">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center Section: Flexible & Bounded Search Form (Doesn't squeeze edges) */}
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-[320px] xl:max-w-[360px] min-w-0 mx-2 xl:mx-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(headerSearch);
                }}
                className="relative w-full"
              >
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#786b65] pointer-events-none"
                  strokeWidth={1.75}
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={headerSearch}
                  onChange={(e) => setHeaderDraft({ key: location.search, value: e.target.value })}
                  aria-label="Tìm kiếm sách, tác giả"
                  placeholder="Tìm kiếm sách, tác giả..."
                  className="w-full h-10 pl-9 pr-4 rounded-full text-xs sm:text-[13px] bg-gray-50/80 hover:bg-gray-100/60 focus:bg-white text-[#121c2a] placeholder:text-[#786b65] border border-gray-200 focus:border-[#9b2f00] focus:ring-2 focus:ring-[#9b2f00]/10 transition-all outline-none"
                />
              </form>
            </div>

            {/* Right Section: Navigation & Action Buttons (Strictly Non-Wrapping) */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0 whitespace-nowrap">

              {/* Primary Nav Links (Bestsellers, New releases, About) */}
              <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0 whitespace-nowrap">
                {navLinks.map((link) => {
                  const active = isNavActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`h-10 px-2.5 xl:px-3 flex items-center justify-center rounded-xl text-xs xl:text-sm font-semibold transition-all no-underline whitespace-nowrap shrink-0 ${
                        active
                          ? 'text-[#9b2f00] bg-[#ffece7]/80'
                          : 'text-[#4a3e39] hover:text-[#9b2f00] hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Vertical Separator */}
              <div className="hidden lg:block h-5 w-px bg-gray-200 mx-1 shrink-0" />

              {/* Action Buttons: 40x40px clickable areas */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                {/* Search Toggle Icon Button (for < lg screens) */}
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#4a3e39] hover:bg-gray-50 hover:text-[#9b2f00] transition-colors shrink-0"
                  aria-label="Tìm kiếm"
                >
                  <Search size={19} strokeWidth={1.75} />
                </button>

                {/* Wishlist Button: 40x40px */}
                <Link
                  to="/wishlist"
                  className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors no-underline shrink-0 ${
                    location.pathname === '/wishlist'
                      ? 'bg-[#ffece7] text-[#c2410c]'
                      : 'text-[#4a3e39] hover:bg-gray-50 hover:text-[#c2410c]'
                  }`}
                  aria-label="Sách yêu thích"
                  title="Sách yêu thích"
                >
                  <Heart
                    size={20}
                    strokeWidth={1.75}
                    className={wishlistCount > 0 ? "fill-[#c2410c]/15 text-[#c2410c]" : ""}
                  />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-[#c2410c] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs pointer-events-none">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart Button: 40x40px with Circular Orange Badge */}
                <Link
                  to="/cart"
                  className="relative w-10 h-10 flex items-center justify-center rounded-xl text-[#4a3e39] hover:bg-gray-50 hover:text-[#9b2f00] transition-colors no-underline shrink-0"
                  aria-label="Giỏ hàng"
                  title="Giỏ hàng"
                >
                  <ShoppingCart size={20} strokeWidth={1.75} />
                  <span className="absolute top-0.5 right-0.5 bg-[#c2410c] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs pointer-events-none">
                    {(itemCount ?? 0) > 99 ? '99+' : (itemCount ?? 0)}
                  </span>
                </Link>

                {/* Desktop User Menu / Auth Buttons */}
                <div className="hidden sm:flex items-center pl-1 shrink-0 whitespace-nowrap">
                  {isAuthenticated ? (
                    <div className="relative group shrink-0">
                      <button
                        type="button"
                        className="h-10 flex items-center gap-2 px-2.5 rounded-xl hover:bg-gray-50 transition-colors text-[#4a3e39] shrink-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#ffece7] text-[#9b2f00] font-bold text-xs flex items-center justify-center shrink-0">
                          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User size={15} />}
                        </div>
                        <span className="text-xs font-semibold max-w-[90px] truncate">
                          {user?.full_name || 'Tài khoản'}
                        </span>
                        <ChevronDown size={13} className="text-[#786b65] shrink-0" />
                      </button>

                      {/* Dropdown menu */}
                      <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-[11px] text-[#786b65]">Đang đăng nhập với</p>
                          <p className="text-xs font-bold text-[#121c2a] truncate">{user?.full_name}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#4a3e39] hover:bg-gray-50 transition-colors no-underline"
                        >
                          <User size={15} />
                          Hồ sơ cá nhân
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#4a3e39] hover:bg-gray-50 transition-colors no-underline"
                        >
                          <ClipboardList size={15} />
                          Đơn hàng của tôi
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#4a3e39] hover:bg-gray-50 transition-colors no-underline"
                        >
                          <Heart size={15} className="text-[#c2410c]" />
                          Sách yêu thích {wishlistCount > 0 ? `(${wishlistCount})` : ''}
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#c2410c] hover:bg-[#ffece7] border-t border-gray-100 transition-colors"
                        >
                          <LogOut size={15} />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                      <Link
                        to="/login"
                        className="h-10 px-4 flex items-center justify-center rounded-full text-sm font-semibold text-[#4a3e39] hover:text-[#9b2f00] hover:bg-gray-50 transition-colors no-underline whitespace-nowrap shrink-0"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        className="h-10 px-5 flex items-center justify-center rounded-full text-sm font-semibold text-white bg-[#c2410c] hover:bg-[#9b2f00] transition-colors shadow-xs no-underline whitespace-nowrap shrink-0"
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Hamburger: 40x40px */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#4a3e39] hover:bg-gray-50 transition-colors shrink-0"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

          </div>

          {/* Mobile Search Dropdown */}
          {mobileSearchOpen && (
            <div className="lg:hidden px-4 py-3 bg-white border-b border-gray-100 shadow-md animate-slide-up">
              <form onSubmit={event => { event.preventDefault(); handleSearch(headerSearch); }} className="flex gap-2">
                <input type="search" aria-label="Tìm kiếm sách trên điện thoại" value={headerSearch}
                  onChange={event => setHeaderDraft({ key: location.search, value: event.target.value })}
                  placeholder="Tìm kiếm sách, tác giả…" className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink" />
                <button type="submit" className="rounded-xl bg-cta px-4 py-2 text-sm font-semibold text-white">Tìm</button>
              </form>
            </div>
          )}

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-3 shadow-xl max-h-[80vh] overflow-y-auto animate-slide-up">
              {/* Level-2 Categories Accordion for Mobile */}
              <div className="border border-[#e5e7eb] rounded-xl p-3 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9b2f00]">
                  <Menu size={14} strokeWidth={2.5} />
                  <span>DANH MỤC SÁCH</span>
                </div>
                <div className="space-y-1">
                  {megaCategories.map((cat) => {
                    const isExpanded = mobileExpandedCat === cat.id;
                    return (
                      <div key={cat.id} className="rounded-lg bg-white border border-[#e5e7eb] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setMobileExpandedCat(isExpanded ? '' : cat.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#121c2a]"
                        >
                          <span>{cat.name}</span>
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="p-2 border-t border-[#e5e7eb] bg-gray-50/50 grid grid-cols-1 gap-1">
                            {cat.subItems.map((sub, i) => (
                              <Link
                                key={i}
                                to={sub.link}
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-2.5 py-1.5 text-xs text-[#59413a] hover:text-[#9b2f00] flex items-center justify-between no-underline"
                              >
                                <span>{sub.title}</span>
                                {sub.badge && (
                                  <span className="text-[10px] px-1 py-0.5 rounded bg-[#ffece7] text-[#c2410c] font-bold">
                                    {sub.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standard Nav Links */}
              <div className="space-y-1 pt-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-[#59413a] hover:bg-gray-50 no-underline"
                  >
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Auth links on mobile */}
              <div className="pt-3 border-t border-gray-100">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#59413a] no-underline"
                    >
                      <User size={16} /> Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#59413a] no-underline"
                    >
                      <ClipboardList size={16} /> Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-sm text-[#59413a] no-underline"
                    >
                      <span className="flex items-center gap-2.5">
                        <Heart size={16} className="text-[#c2410c]" /> Sách yêu thích
                      </span>
                      {wishlistCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffece7] text-[#c2410c] font-bold">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#c2410c] font-semibold"
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2 text-center text-xs font-semibold rounded-xl border border-gray-200 text-[#59413a] no-underline"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2 text-center text-xs font-semibold rounded-xl bg-[#c2410c] text-[#ffece7] no-underline"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ===== MAIN CONTENT AREA ===== */}
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* ===== FOOTER (BookZone: Pure White Minimalist) ===== */}
        <footer className="bg-white border-t border-gray-100 text-[#4a3e39] pt-14 pb-20 md:pb-10 transition-colors">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Literary Quote Ribbon */}
            <div className="mb-10">
              <LiteraryQuote variant="footer" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

              {/* Col 1: Brand Info */}
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="font-playfair font-bold text-2xl text-[#9b2f00] leading-none">
                    Phương Anh
                  </span>
                  <span className="text-[10px] tracking-wider uppercase text-[#786b65] font-semibold mt-1">
                    Nhà sách trực tuyến
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#59413a]">
                  Nền tảng tri thức & kết nối độc giả chuẩn mực. Không gian khám phá văn học và những tựa sách tuyển chọn.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-gray-50 text-[#59413a] hover:text-[#9b2f00] flex items-center justify-center transition-colors shadow-2xs border border-gray-150"
                    aria-label="Facebook"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-gray-50 text-[#59413a] hover:text-[#9b2f00] flex items-center justify-center transition-colors shadow-2xs border border-gray-150"
                    aria-label="Instagram"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-gray-50 text-[#59413a] hover:text-[#9b2f00] flex items-center justify-center transition-colors shadow-2xs border border-gray-150"
                    aria-label="Youtube"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Col 2: Khám phá sách */}
              <div className="space-y-3">
                <h4 className="font-playfair font-bold text-sm text-[#121c2a] uppercase tracking-wider">
                  Khám phá sách
                </h4>
                <ul className="space-y-2 text-xs">
                  {footerExploreLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-[#59413a] hover:text-[#9b2f00] transition-colors no-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3: Hỗ trợ khách hàng */}
              <div className="space-y-3">
                <h4 className="font-playfair font-bold text-sm text-[#121c2a] uppercase tracking-wider">
                  Hỗ trợ khách hàng
                </h4>
                <ul className="space-y-2 text-xs">
                  {footerSupportLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-[#59413a] hover:text-[#9b2f00] transition-colors no-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d7168]">
                    Hotline hỗ trợ 24/7
                  </p>
                  <p className="text-base font-bold text-[#9b2f00]">
                    1900 6868
                  </p>
                </div>
              </div>

              {/* Col 4: Bản tin Văn hóa */}
              <div className="space-y-3">
                <h4 className="font-playfair font-bold text-sm text-[#121c2a] uppercase tracking-wider">
                  Bản tin Văn hóa
                </h4>
                <p className="text-xs leading-relaxed text-[#59413a]">
                  Nhận điểm tin sách hay, tiểu luận tác giả và ưu đãi độc quyền phát hành mỗi sáng thứ Bảy.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-xs">
                    <Mail size={15} className="text-[#8d7168] shrink-0" />
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Địa chỉ email của bạn..."
                      className="w-full bg-transparent text-xs text-[#121c2a] outline-none placeholder:text-[#8d7168]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold text-[#ffece7] bg-[#c2410c] hover:bg-[#9b2f00] transition-colors shadow-xs"
                  >
                    Đăng ký nhận tin
                  </button>
                </form>
              </div>

            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8d7168]">
              <p>© {new Date().getFullYear()} Phương Anh Vietnam. Tất cả quyền được bảo lưu.</p>
              <div className="flex items-center gap-4">
                <Link to="/about" className="hover:text-[#9b2f00] no-underline font-medium text-[#121c2a]">Về Phương Anh</Link>
                <Link to="/terms" className="hover:text-[#9b2f00] no-underline">Điều khoản dịch vụ</Link>
                <Link to="/privacy" className="hover:text-[#9b2f00] no-underline">Chính sách bảo mật</Link>
                <Link to="/contact" className="hover:text-[#9b2f00] no-underline">Liên hệ hợp tác</Link>
              </div>
            </div>
          </div>
        </footer>

        <ChatWidget />

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-150 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold no-underline ${
              isNavActive('/') && location.pathname === '/'
                ? 'text-[#9b2f00]'
                : 'text-[#8d7168]'
            }`}
          >
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>

          <Link
            to="/books"
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold no-underline ${
              isNavActive('/books')
                ? 'text-[#9b2f00]'
                : 'text-[#8d7168]'
            }`}
          >
            <BookOpen size={18} />
            <span>Kho sách</span>
          </Link>

          <Link
            to="/cart"
            className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold no-underline ${
              isNavActive('/cart')
                ? 'text-[#9b2f00]'
                : 'text-[#8d7168]'
            }`}
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute top-0 right-2 bg-[#c2410c] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
            <span>Giỏ hàng</span>
          </Link>

          <Link
            to="/orders"
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold no-underline ${
              isNavActive('/orders')
                ? 'text-[#9b2f00]'
                : 'text-[#8d7168]'
            }`}
          >
            <ClipboardList size={18} />
            <span>Đơn hàng</span>
          </Link>

          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold no-underline ${
              isNavActive('/profile') || isNavActive('/login')
                ? 'text-[#9b2f00]'
                : 'text-[#8d7168]'
            }`}
          >
            <User size={18} />
            <span>{isAuthenticated ? 'Tài khoản' : 'Đăng nhập'}</span>
          </Link>
        </nav>
      </div>

    </ErrorBoundary>
  );
};

export default CustomerLayout;
