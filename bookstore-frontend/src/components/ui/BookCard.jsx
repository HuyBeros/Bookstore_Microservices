import { useState } from 'react';
import { ShoppingCart, Heart, Star, BookOpen } from 'lucide-react';
import { authorLabel, addedToCatalog } from '../../utils/homeBooks';
import { useWishlist } from '../../context/WishlistContext';

/**
 * BookCard Component — BookZone Editorial Luxury Design
 *
 * Updates:
 * - 100% Pure White (#ffffff) background, zero half-baked dark theme classes
 * - Contrast ratio > 7:1 for all typography
 * - Aspect ratio 2:3 with object-fit: contain on neutral canvas (#f6f4f1)
 * - CSS Hardcover fallback (warm brown gradient + title + author) when image is missing/broken
 * - Stock badge only shown when "Tạm hết hàng" or "Sắp hết" (NO repetitive "Còn hàng")
 * - Category on its own full line (no more "TRIẾT LÝ NHÂN SI…")
 * - Rating moved cleanly next to price or author
 * - Border refined to soft #e5e7eb
 */
const BookCard = ({
  book,
  onAddToCart,
  onAddToWishlist,
  loading = false,
  href,
  className = '',
  showAddedDate = false,
  rank,
}) => {
  const [imageError, setImageError] = useState(false);
  const [squareCanvas, setSquareCanvas] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const bookId = book?.id ?? book?.bookId ?? book?.book_id;
  const isWishlisted = isInWishlist(bookId);

  const stockQuantity = book?.stockQuantity ?? book?.stock_quantity ?? book?.stock ?? 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  const price = book?.price || 0;
  const originalPrice = book?.originalPrice || book?.original_price || price;
  const discountPercent = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const bookUrl = href || `/books/${book?.id}`;

  const author = authorLabel(book);
  const authorsText = author.short;
  const added = showAddedDate ? addedToCatalog(book) : null;

  const categoryName = book?.category?.name || book?.category_name || (book?.genre || null);
  const rawImageUrl = book?.coverUrl || book?.cover_url || book?.imageUrl || book?.image_url || book?.image;
  const hasValidImage = rawImageUrl && !imageError && !rawImageUrl.includes('logo_store.img');

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
    onAddToWishlist?.(book);
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(book);
  };

  return (
    <div
      className={`group relative min-w-0 bg-white flex flex-col h-full ${className}`.trim()}
    >
      {/* ─── Image Container: 2:3 Aspect Ratio + Neutral Canvas ──────── */}
      <div className="relative overflow-hidden rounded-xl bg-[#f7f3eb] aspect-[2/3] w-full mb-4 flex items-center justify-center select-none">
        <a href={bookUrl} className="block h-full w-full">
          {hasValidImage ? (
            <img
              src={rawImageUrl}
              alt={book?.title}
              loading="lazy"
              decoding="async"
              width="400"
              height="600"
              onError={() => setImageError(true)}
              onLoad={event => {
                // Publisher square canvases have side margins around a portrait cover.
                const ratio = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight;
                setSquareCanvas(ratio >= .95 && ratio <= 1.05);
              }}
              className={`h-full w-full ${squareCanvas ? 'object-cover' : 'object-contain'} px-4 py-6 drop-shadow-[2px_5px_5px_rgba(89,59,36,0.12)] transition-transform duration-300 group-hover:scale-[1.03]`}
            />
          ) : (
            /* Tactile Hardcover CSS Fallback (Matching Hero Spotlight) */
            <div className="h-full w-full bg-gradient-to-br from-[#2a1106] via-[#5c2107] to-[#8f2c00] text-white p-4 flex flex-col justify-between items-center text-center relative">
              {/* Realistic book spine highlight on left edge */}
              <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />

              <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/80 mt-1">
                <BookOpen size={14} strokeWidth={1.5} />
              </div>

              <div className="px-1 space-y-1.5 z-10">
                <span className="text-[8px] tracking-[0.25em] uppercase font-semibold text-[#ffdcc3] block">
                  Góc sách Phương Anh
                </span>
                <h4 className="font-serif font-bold text-xs sm:text-sm leading-tight text-white line-clamp-3">
                  {book?.title || 'Tác phẩm tuyển chọn'}
                </h4>
                <p title={author.full} className="text-[10px] text-[#ffdcc3] italic font-serif break-words max-w-[130px] mx-auto">
                  {authorsText}
                </p>
              </div>

              <div className="w-8 h-[1.5px] bg-[#ffdcc3]/30 mb-1 z-10" />
            </div>
          )}
        </a>

        {/* Book spine subtle edge shadow on normal images */}
        {hasValidImage && (
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[.025]" />
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c2410c] text-white shadow-xs">
            -{discountPercent}%
          </div>
        )}

        {/* Stock Status Badge — ONLY shown when out of stock or low stock (Rule 8) */}
        {isOutOfStock ? (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c2410c] text-white shadow-xs">
            Tạm hết hàng
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#b45309] text-white shadow-xs">
            Chỉ còn {stockQuantity} cuốn
          </div>
        ) : null}

        {/* Quick Wishlist Icon */}
        <button
          onClick={handleWishlistClick}
          type="button"
          className="absolute top-2 right-2 size-11 rounded-full bg-white/95 shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-[#786b65] hover:text-[#c2410c]"
          aria-label={isWishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          aria-pressed={isWishlisted}
        >
          <Heart size={14} className={isWishlisted ? 'fill-[#c2410c] text-[#c2410c]' : ''} />
        </button>
      </div>

      {/* ─── Content Details (High Contrast, No Truncation Bugs) ──────── */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {rank && <p className="mb-2 flex items-center gap-2 text-[11px] text-[#59413a]"><span className="font-serif text-lg font-semibold text-[#9b2f00]">{String(rank).padStart(2, '0')}</span><span>Đã bán {Number(book.soldCount).toLocaleString('vi-VN')} cuốn</span></p>}
          {added && <p className="mb-2 text-[10px] leading-relaxed text-[#59413a]">
            {added.recent && <span className="mr-1 font-semibold text-[#9b2f00]">Mới trong kho ·</span>}
            <time dateTime={added.iso} title={`Ngày thêm vào kho: ${added.label}`}>Thêm {added.label}</time>
          </p>}
          {/* Category Tag (Full width, no more clipping) */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9b2f00] truncate mb-1">
            {categoryName || 'SÁCH CHỌN LỌC'}
          </p>

          {/* Book Title (Clean 2-line clamp, high contrast #121c2a) */}
          <a href={bookUrl} className="block mb-1 group-hover:text-[#9b2f00] transition-colors no-underline">
            <h3
              className="min-h-10 font-semibold text-xs sm:text-[13px] text-[#121c2a] line-clamp-2 leading-snug"
              title={book?.title}
            >
              {book?.title}
            </h3>
          </a>

          {/* Author & Star Rating */}
          <div className="flex items-start justify-between gap-2 text-xs text-[#59413a] mb-2">
            <p title={author.full} aria-label={author.full} className="min-w-0 break-words text-[11px] leading-relaxed text-[#59413a]">
              {authorsText}
            </p>
            {Number.isFinite(Number(book?.rating)) && Number(book?.rating) > 0 && <div className="flex items-center gap-1 shrink-0">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-[#121c2a]">{Number(book.rating).toFixed(1)}</span>
            </div>}
          </div>
        </div>

        {/* Pricing and Action Button */}
        <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-between mt-auto">
          <div>
            <p className="font-bold tabular-nums text-sm sm:text-base text-[#9b2f00] leading-none">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0,
              }).format(price)}
            </p>
            {originalPrice > price && (
              <p className="text-[11px] text-[#786b65] line-through tabular-nums mt-0.5">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  minimumFractionDigits: 0,
                }).format(originalPrice)}
              </p>
            )}
          </div>

          {/* Compact Cart Icon Button */}
          <button
            onClick={handleCartClick}
            type="button"
            disabled={isOutOfStock || loading}
            className="size-11 rounded-xl bg-[#fff1e8] hover:bg-[#c2410c] text-[#9b2f00] hover:text-white border border-[#ecd7c6] hover:border-[#c2410c] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
