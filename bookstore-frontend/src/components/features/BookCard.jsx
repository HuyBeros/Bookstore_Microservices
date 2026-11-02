import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, BookOpen } from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import { getStockStatus } from '../../utils/helpers';
import { STOCK_STATUS_LABELS } from '../../utils/constants';
import { useWishlist } from '../../context/WishlistContext';

/**
 * BookCard: Thẻ sản phẩm sách BookZone theme
 */
const BookCard = ({
  book,
  onAddToCart,
  onAddToWishlist,
  loading = false,
  className = '',
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const bookId = book?.id ?? book?.bookId ?? book?.book_id;
  const isWishlisted = isInWishlist(bookId);
  const [imgError, setImgError] = useState(false);

  const stockStatus = getStockStatus(book?.stock ?? book?.stockQuantity);
  const isOutOfStock = stockStatus === 'out_of_stock';

  const price = book?.price || 0;
  const coverImage = book?.coverUrl || book?.cover_url || book?.imageUrl || book?.image_url || book?.image;
  const originalPrice = book?.originalPrice || book?.original_price || (price > 0 ? Math.round(price * 1.25) : 0);
  const discountPercent = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(book);
    }
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
    if (onAddToWishlist) {
      onAddToWishlist(book);
    }
  };

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden flex flex-col h-full hover:shadow-[0_12px_24px_-8px_rgba(155,47,0,0.15)] hover:border-[#ffdcc3] hover:-translate-y-1 transition-all duration-300 ${className}`}
    >
      {/* Book Cover Image Area */}
      <Link
        to={`/books/${book.id}`}
        className="relative block w-full pt-[130%] bg-gray-50 overflow-hidden"
      >
        {coverImage && !imgError ? (
          <img
            src={coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gray-50">
            <BookOpen size={36} className="text-[#9b2f00] mb-2 opacity-40" />
            <p className="text-[11px] font-medium text-[#8d7168] line-clamp-2 px-2">
              {book.title}
            </p>
          </div>
        )}

        {/* Book Spine shadow gradient */}
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div
            className="absolute top-2 left-2 font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-sm"
            style={{ background: '#c2410c', color: '#ffece7' }}
          >
            -{discountPercent}%
          </div>
        )}

        {/* Stock Status Badge */}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-sm"
          style={{
            background: isOutOfStock ? '#ffece7' : '#bdedd7',
            color: isOutOfStock ? '#c2410c' : '#3b6756',
          }}
        >
          {STOCK_STATUS_LABELS[stockStatus] || (isOutOfStock ? 'Hết hàng' : 'Còn hàng')}
        </div>

        {/* Quick Wishlist Icon */}
        <button
          onClick={handleAddToWishlist}
          disabled={loading}
          type="button"
          className="absolute bottom-2 right-2 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md transition-all hover:scale-110 active:scale-95 text-[#8d7168] hover:text-[#c2410c]"
          aria-label="Thêm vào yêu thích"
        >
          <Heart size={15} fill={isWishlisted ? '#c2410c' : 'none'} color={isWishlisted ? '#c2410c' : 'currentColor'} />
        </button>
      </Link>

      {/* Book Info Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          {book.category && (
            <Link
              to={`/books?category=${book.category.id}`}
              className="inline-block text-[11px] font-semibold hover:underline mb-1 truncate max-w-full uppercase tracking-wider"
              style={{ color: '#3b6756' }}
            >
              {book.category.name}
            </Link>
          )}

          {/* Book Title */}
          <Link
            to={`/books/${book.id}`}
            className="block text-xs sm:text-sm font-semibold hover:text-[#9b2f00] line-clamp-2 leading-snug mb-1 transition-colors"
            style={{ color: '#121c2a' }}
            title={book.title}
          >
            {book.title}
          </Link>

          {/* Authors */}
          {book.authors && book.authors.length > 0 && (
            <p className="text-[11px] sm:text-xs line-clamp-1 mb-2" style={{ color: '#8d7168' }}>
              {book.authors.map((a) => a.name || a.authorName).join(', ')}
            </p>
          )}

          {/* Rating Display */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-amber-400">
              <Star size={12} fill="currentColor" />
            </div>
            <span className="text-[11px] font-medium" style={{ color: '#59413a' }}>
              {book.rating ? Number(book.rating).toFixed(1) : '4.9'}
            </span>
            <span className="text-[10px]" style={{ color: '#8d7168' }}>
              ({book.reviewsCount || 48})
            </span>
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 mt-auto">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm sm:text-base font-bold" style={{ color: '#9b2f00' }}>
              {formatVND(book.price)}
            </span>
            {originalPrice > book.price && (
              <span className="text-[10px] sm:text-xs line-through" style={{ color: '#8d7168' }}>
                {formatVND(originalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || loading}
            type="button"
            className="w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            style={{ background: '#c2410c', color: '#ffece7' }}
            onMouseEnter={(e) => { if (!isOutOfStock) e.currentTarget.style.background = '#9b2f00'; }}
            onMouseLeave={(e) => { if (!isOutOfStock) e.currentTarget.style.background = '#c2410c'; }}
          >
            <ShoppingCart size={14} />
            <span>{isOutOfStock ? 'Hết hàng' : 'Thêm giỏ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
