import React, { useMemo } from 'react';
import { BookOpen, Quote } from 'lucide-react';
import { getRandomQuote, getDailyQuote } from '../../data/literaryQuotes';

/**
 * LiteraryQuote Component
 * Hiển thị trích dẫn văn học kinh điển
 * Các biến thể:
 * - 'card': Khối thẻ nền giấy ấm có viền trang nhã (thích hợp cho Auth, EmptyState)
 * - 'footer': Thanh trích dẫn thanh mảnh trang trọng dành cho chân trang
 * - 'inline': Dòng trích dẫn tối giản một dòng
 */
const LiteraryQuote = ({
  variant = 'card',
  random = false,
  className = '',
}) => {
  const quoteItem = useMemo(() => {
    return random ? getRandomQuote() : getDailyQuote();
  }, [random]);

  if (variant === 'footer') {
    return (
      <div className={`py-6 border-b border-border/80 text-center ${className}`.trim()}>
        <div className="flex items-center justify-center gap-3 mb-2 text-primary opacity-80">
          <span className="h-px w-10 bg-primary/20" />
          <BookOpen size={16} strokeWidth={1.5} aria-hidden="true" />
          <span className="h-px w-10 bg-primary/20" />
        </div>
        <blockquote className="font-serif italic text-ink text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          &ldquo;{quoteItem.quote}&rdquo;
        </blockquote>
        <cite className="block mt-2 text-xs tracking-wider uppercase text-ink-muted not-italic font-medium">
          — {quoteItem.author} {quoteItem.source ? `(${quoteItem.source})` : ''}
        </cite>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`text-xs text-ink-muted leading-relaxed font-serif italic ${className}`.trim()}>
        <span>&ldquo;{quoteItem.quote}&rdquo;</span>
        <span className="not-italic font-sans text-ink-muted/80 ml-2">— {quoteItem.author}</span>
      </div>
    );
  }

  // Variant 'card' (mặc định)
  return (
    <div
      className={`relative rounded-xl bg-[#f7f2eb] border border-[#ede3d5] p-5 text-left transition-colors ${className}`.trim()}
    >
      <Quote
        size={24}
        className="text-primary/25 absolute top-4 right-4 pointer-events-none"
        aria-hidden="true"
      />
      <blockquote className="font-serif italic text-ink text-sm sm:text-base leading-relaxed pr-6">
        &ldquo;{quoteItem.quote}&rdquo;
      </blockquote>
      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
        <cite className="not-italic font-medium text-primary">
          — {quoteItem.author}
        </cite>
        {quoteItem.source && (
          <span className="text-[11px] opacity-75">{quoteItem.source}</span>
        )}
      </div>
    </div>
  );
};

export default LiteraryQuote;
