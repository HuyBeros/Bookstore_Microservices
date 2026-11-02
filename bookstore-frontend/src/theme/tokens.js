/**
 * Design Tokens - JavaScript Export
 * Used for programmatic access to design tokens (e.g., in charts, dynamic components)
 * CSS variables are preferred for styling; use this for JS logic only.
 */

export const tokens = {
  // Light Mode Colors
  light: {
    paper: '#FBF8F3',
    surface: '#FFFFFF',
    surfaceMuted: '#F9F6F1',
    ink: '#1F1C17',
    inkMuted: '#6B6660',
    border: '#E8E3DB',
    primary: '#1F5F4A',
    primaryLight: '#E8F1ED',
    primaryDark: '#0D2F23',
    accent: '#D98324',
    accentLight: '#FCE8D9',
    accentDark: '#B85F0B',
    success: '#2ECC71',
    successSoft: '#E8F8F0',
    warning: '#F39C12',
    warningSoft: '#FEF5E7',
    danger: '#E74C3C',
    dangerSoft: '#FADBD8',
    info: '#3498DB',
    infoSoft: '#EBF5FB',
  },

  // Dark Mode Colors
  dark: {
    paper: '#14120F',
    surface: '#1E1A16',
    surfaceMuted: '#2A2520',
    ink: '#F5F1ED',
    inkMuted: '#A89F96',
    border: '#3D3530',
    primary: '#5BBF97',
    primaryLight: '#1A3E2F',
    primaryDark: '#7ED6AE',
    accent: '#F0A04B',
    accentLight: '#5C3D1A',
    accentDark: '#F5B76B',
    success: '#48CC7F',
    successSoft: '#1A3E2F',
    warning: '#F5A623',
    warningSoft: '#4C3D1F',
    danger: '#FF5252',
    dangerSoft: '#4C2020',
    info: '#4A9FFF',
    infoSoft: '#1F3D5C',
  },

  // Typography Scale (in rem)
  typography: {
    displayLg: { size: '2.75rem', weight: 700, lineHeight: 1.2 },
    displayMd: { size: '2.25rem', weight: 700, lineHeight: 1.25 },
    displaySm: { size: '1.875rem', weight: 700, lineHeight: 1.3 },
    headingLg: { size: '1.5rem', weight: 600, lineHeight: 1.4 },
    headingMd: { size: '1.25rem', weight: 600, lineHeight: 1.5 },
    headingSm: { size: '1.125rem', weight: 600, lineHeight: 1.5 },
    bodyLg: { size: '1.0625rem', weight: 400, lineHeight: 1.6 },
    bodyMd: { size: '1rem', weight: 400, lineHeight: 1.6 },
    bodySm: { size: '0.9375rem', weight: 400, lineHeight: 1.6 },
    caption: { size: '0.875rem', weight: 400, lineHeight: 1.5 },
    label: { size: '0.8125rem', weight: 500, lineHeight: 1.5 },
  },

  // Spacing Scale (in rem, based on 4px)
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.75rem', // 28px
    '4xl': '2rem', // 32px
  },

  // Border Radius
  borderRadius: {
    button: '0.75rem', // 12px
    input: '0.75rem', // 12px
    card: '1rem', // 16px
    modal: '1rem', // 16px
    badge: '9999px', // full
    cover: '0.5rem', // 8px
  },

  // Shadows (light mode by default)
  shadows: {
    sm: '0 2px 4px rgba(60, 40, 10, 0.08)',
    md: '0 4px 12px rgba(60, 40, 10, 0.08)',
    lg: '0 10px 24px rgba(60, 40, 10, 0.08)',
    smDark: '0 2px 4px rgba(0, 0, 0, 0.32)',
    mdDark: '0 4px 12px rgba(0, 0, 0, 0.32)',
    lgDark: '0 10px 24px rgba(0, 0, 0, 0.32)',
  },

  // Font Families
  fonts: {
    heading: "'Lora', serif",
    body: "'Be Vietnam Pro', sans-serif",
    mono: "'Roboto Mono', monospace",
  },
};

/**
 * Get color based on current theme mode
 * @param {string} mode - 'light' or 'dark'
 * @param {string} colorName - color key (e.g., 'primary', 'accent', 'success')
 * @returns {string} hex color value
 */
export const getTokenColor = (mode, colorName) => {
  return tokens[mode]?.[colorName] || null;
};

/**
 * Get current theme mode from DOM
 * @returns {string} 'light' or 'dark'
 */
export const getCurrentTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) return 'dark';
  
  // Fallback to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

/**
 * Get color for charts, etc. based on current theme
 * @param {string} colorName - color key
 * @returns {string} hex color value
 */
export const getThemeColor = (colorName) => {
  const mode = getCurrentTheme();
  return getTokenColor(mode, colorName);
};
