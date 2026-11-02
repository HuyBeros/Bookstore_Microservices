/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[class="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic color aliases mapped to CSS variables
        paper: 'var(--color-paper)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        ink: 'var(--color-ink)',
        'ink-body': 'var(--color-ink-body)',
        'ink-muted': 'var(--color-ink-muted)',
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
        cta: 'var(--color-cta)',
        'cta-light': 'var(--color-cta-light)',
        green: 'var(--color-green)',
        'green-light': 'var(--color-green-light)',
        'search-bg': 'var(--color-search-bg)',
        'badge-warm': 'var(--color-badge-warm)',
        'badge-warm-text': 'var(--color-badge-warm-text)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        'accent-dark': 'var(--color-accent-dark)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        'success-soft': 'var(--color-success-soft)',
        warning: 'var(--color-warning)',
        'warning-soft': 'var(--color-warning-soft)',
        danger: 'var(--color-danger)',
        'danger-soft': 'var(--color-danger-soft)',
        info: 'var(--color-info)',
        'info-soft': 'var(--color-info-soft)',
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Be Vietnam Pro', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        // Semantic typography scale
        'display-lg': ['2.75rem', { lineHeight: '1.2', fontWeight: '700' }], // 44px
        'display-md': ['2.25rem', { lineHeight: '1.25', fontWeight: '700' }], // 36px
        'display-sm': ['1.875rem', { lineHeight: '1.3', fontWeight: '700' }], // 30px
        'heading-lg': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }], // 24px
        'heading-md': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }], // 20px
        'heading-sm': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }], // 18px
        'body-lg': ['1.0625rem', { lineHeight: '1.6' }], // 17px
        'body-md': ['1rem', { lineHeight: '1.6' }], // 16px
        'body-sm': ['0.9375rem', { lineHeight: '1.6' }], // 15px
        'caption': ['0.875rem', { lineHeight: '1.5' }], // 14px
        'label': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }], // 13px
      },
      spacing: {
        // Semantic spacing (based on 4px)
        xs: '0.25rem', // 4px
        sm: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.75rem', // 28px
        '4xl': '2rem', // 32px
      },
      borderRadius: {
        'button': '0.75rem', // 12px
        'input': '0.75rem', // 12px
        'card': '1rem', // 16px
        'modal': '1rem', // 16px
        'badge': '9999px', // full
        'cover': '0.5rem', // 8px
      },
      boxShadow: {
        sm: '0 2px 4px rgba(18, 28, 42, 0.08)',
        md: '0 4px 12px rgba(18, 28, 42, 0.08)',
        lg: '0 10px 24px rgba(18, 28, 42, 0.10)',
        xl: '0 20px 48px rgba(18, 28, 42, 0.12)',
        // Dark mode shadows
        'sm-dark': '0 2px 4px rgba(0, 0, 0, 0.32)',
        'md-dark': '0 4px 12px rgba(0, 0, 0, 0.32)',
        'lg-dark': '0 10px 24px rgba(0, 0, 0, 0.32)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  corePlugins: {
    preflight: false, // We handle base styles in index.css
  },
}
