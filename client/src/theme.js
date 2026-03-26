// Professional Corporate Theme
// Insurance Company Color Scheme

export const theme = {
  // Primary Colors - Corporate Blue
  colors: {
    primary: '#1D4ED8',        // Deep corporate blue
    primaryLight: '#0065FF',   // Lighter blue for hovers
    primaryDark: '#003D99',    // Darker blue for depth
    
    secondary: '#00B8D4',      // Accent cyan
    secondaryLight: '#00E5FF', // Light cyan
    
    // Neutrals
    white: '#FFFFFF',
    offWhite: '#F8FAFB',
    lightGray: '#E8EDF2',
    gray: '#8B9DAF',
    darkGray: '#475569',
    dark: '#0F172A',
    
    // Status Colors
    success: '#22C55E',
    successLight: '#E8F5E9',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    error: '#DC2626',
    errorLight: '#FFEBEE',
    info: '#0284C7',
    infoLight: '#E1F5FE',
    
    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8FAFB',
    bgTertiary: '#E8EDF2',
    
    // Text
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#8B9DAF',
    textWhite: '#FFFFFF',
  },
  
  // Typography
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Poppins', 'Inter', sans-serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Border Radius
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Common Styles
export const commonStyles = {
  // Card
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.md,
    padding: theme.spacing.xl,
    border: `1px solid ${theme.colors.lightGray}`,
  },
  
  // Button Primary
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    borderRadius: theme.borderRadius.md,
    border: 'none',
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.semibold,
    cursor: 'pointer',
    transition: theme.transitions.base,
    fontFamily: theme.fonts.primary,
  },
  
  // Button Secondary
  buttonSecondary: {
    backgroundColor: theme.colors.white,
    color: theme.colors.primary,
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    borderRadius: theme.borderRadius.md,
    border: `2px solid ${theme.colors.primary}`,
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.semibold,
    cursor: 'pointer',
    transition: theme.transitions.base,
    fontFamily: theme.fonts.primary,
  },
  
  // Input
  input: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.lightGray}`,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.primary,
    transition: theme.transitions.base,
    backgroundColor: theme.colors.white,
  },
  
  // Badge
  badge: {
    display: 'inline-block',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.full,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  // Container
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `0 ${theme.spacing.xl}`,
  },
  
  // Page
  page: {
    minHeight: '100vh',
    backgroundColor: theme.colors.bgSecondary,
    fontFamily: theme.fonts.primary,
  },
};

export default theme;
