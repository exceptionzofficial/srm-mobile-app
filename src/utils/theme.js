/**
 * Theme Constants for SRM Sweets Mobile App
 * Centralized color and styling constants
 */

// Brand Colors
export const COLORS = {
    // Primary
    primary: '#FF6B35',
    primaryDark: '#E55A2B',
    primaryLight: '#FF8555',

    // Status Colors
    success: '#4CAF50',
    successLight: 'rgba(76,175,80,0.9)',
    warning: '#FF9800',
    warningLight: 'rgba(255,193,7,0.9)',
    danger: '#f44336',
    dangerLight: 'rgba(244,67,54,0.9)',

    // Neutral Colors
    white: '#fff',
    black: '#000',
    background: '#f5f5f5',
    backgroundDark: '#1a1a2e',
    surface: '#fff',

    // Text Colors
    textPrimary: '#1a1a2e',
    textSecondary: '#333',
    textMuted: '#666',
    textLight: '#999',

    // Border Colors
    border: '#e0e0e0',
    borderLight: '#f0f0f0',

    // Overlay
    overlay: 'rgba(0,0,0,0.5)',

    // Links
    link: '#4fc3f7',
    info: '#1976d2',
    infoBackground: '#e8f4fd',
};

// Spacing
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 40,
};

// Border Radius
export const BORDER_RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 40,
};

// Font Sizes
export const FONT_SIZE = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 36,
};

// Status badge styles
export const getStatusColor = (status) => {
    switch (status) {
        case 'present':
            return COLORS.success;
        case 'late':
            return COLORS.warning;
        case 'half-day':
            return COLORS.danger;
        default:
            return COLORS.textLight;
    }
};

export default {
    COLORS,
    SPACING,
    BORDER_RADIUS,
    FONT_SIZE,
    getStatusColor,
};
