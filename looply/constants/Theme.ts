/**
 * Design System for Looply App
 * Dark theme with matte orange accents for a luxurious feel
 */

export const Theme = {
  colors: {
    // Primary colors - Matte Orange palette
    primary: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316', // Main orange
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    
    // Dark theme colors
    dark: {
      background: '#0F0F0F', // Deep black
      surface: '#1A1A1A', // Slightly lighter black
      surfaceVariant: '#2A2A2A', // Card backgrounds
      surfaceElevated: '#333333', // Elevated surfaces
      border: '#404040', // Subtle borders
      borderLight: '#2A2A2A', // Lighter borders
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF', // Pure white for primary text
      secondary: '#B3B3B3', // Light gray for secondary text
      tertiary: '#808080', // Medium gray for tertiary text
      disabled: '#4D4D4D', // Disabled text
      inverse: '#000000', // Black text on light backgrounds
    },
    
    // Status colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    
    // Service colors (matching the design)
    service: {
      ride: '#FFFFFF', // White for ride service
      delivery: '#FFFFFF', // White for delivery service
      travel: '#FFFFFF', // White for travel service
      food: '#FFFFFF', // White for food service
    },
    
    // Accent colors
    accent: {
      blue: '#3B82F6',
      green: '#10B981',
      purple: '#8B5CF6',
      pink: '#EC4899',
    },
    
    // Overlay colors
    overlay: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.3)',
      heavy: 'rgba(0, 0, 0, 0.6)',
      white: 'rgba(255, 255, 255, 0.1)',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
    },
    
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semiBold: '600' as const,
      bold: '700' as const,
      extraBold: '800' as const,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 16,
    },
  },

  // Frosted Glass Card Style
  frostedGlassCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Component specific styles
  components: {
    // Service cards (matching the design)
    serviceCard: {
      width: '48%',
      aspectRatio: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    
    // Search bar
    searchBar: {
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 16,
    },
    
    // Activity cards
    activityCard: {
      backgroundColor: '#2A2A2A',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      marginHorizontal: 20,
    },
    
    // Profile menu items
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#2A2A2A',
    },
  },
};

// Light theme (for future toggle functionality)
export const LightTheme = {
  ...Theme,
  colors: {
    ...Theme.colors,
    dark: {
      background: '#FFFFFF',
      surface: '#F9FAFB',
      surfaceVariant: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF',
    },
  },
};

export default Theme;
