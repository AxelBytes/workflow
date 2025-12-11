export const ECLIPSE_THEME = {
  // Primary Colors - Based on ECLIPSE logo
  primary: {
    orange: '#FF6B35',      // Main orange from logo
    orangeLight: '#FF8C42', // Gradient orange
    orangeDark: '#E55A2B',  // Darker orange
    black: '#000000',       // Logo background
    white: '#FFFFFF',       // Logo text
  },
  
  // Extended Palette
  colors: {
    // Gradients
    primaryGradient: ['#FF6B35', '#FF8C42'],
    darkGradient: ['#000000', '#1A1A1A'],
    glassGradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    
    // Backgrounds
    background: '#000000',
    surface: '#0A0A0A',
    card: '#111111',
    glass: 'rgba(255, 255, 255, 0.1)',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#888888',
    
    // Accents
    accent: '#FF6B35',
    success: '#00D4AA',
    warning: '#FFB800',
    error: '#FF4757',
    info: '#4ECDC4',
    
    // Special Effects
    glow: '#FF6B35',
    shadow: 'rgba(255, 107, 53, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  
  // Animations
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

export default ECLIPSE_THEME; 