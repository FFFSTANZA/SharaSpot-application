// Accessibility Utilities for SharaSpot
// Core Principle: Accessibility First - Inclusive design that works for everyone

import { AccessibilityRole, AccessibilityState } from 'react-native';

// ============================================================================
// ACCESSIBILITY PROPS HELPERS
// ============================================================================

export interface A11yProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{ name: string; label?: string }>;
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityElementsHidden?: boolean;
  accessibilityViewIsModal?: boolean;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityIgnoresInvertColors?: boolean;
}

/**
 * Create accessible props for a button
 * @param label - The accessible label for the button
 * @param hint - Optional hint text describing what will happen
 * @param state - Optional state (disabled, selected, busy, checked)
 * @returns Accessibility props object
 */
export const createButtonA11y = (
  label: string,
  hint?: string,
  state?: Partial<AccessibilityState>
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: 'button',
  accessibilityState: state,
});

/**
 * Create accessible props for a text input
 * @param label - The label for the input field
 * @param hint - Optional hint about the expected input
 * @returns Accessibility props object
 */
export const createInputA11y = (
  label: string,
  hint?: string,
  isDisabled?: boolean
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: 'none', // Let TextInput handle its own role
  accessibilityState: isDisabled ? { disabled: true } : undefined,
});

/**
 * Create accessible props for an image
 * @param description - Description of the image content
 * @param isDecorative - If true, image is hidden from screen readers
 * @returns Accessibility props object
 */
export const createImageA11y = (
  description?: string,
  isDecorative: boolean = false
): A11yProps => {
  if (isDecorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no',
    };
  }

  return {
    accessible: true,
    accessibilityLabel: description,
    accessibilityRole: 'image',
  };
};

/**
 * Create accessible props for a link
 * @param label - The label for the link
 * @param hint - Optional hint about where the link goes
 * @returns Accessibility props object
 */
export const createLinkA11y = (label: string, hint?: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: 'link',
});

/**
 * Create accessible props for a heading
 * @param level - Heading level (1-6)
 * @param text - The heading text
 * @returns Accessibility props object
 */
export const createHeadingA11y = (level: number, text: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: text,
  accessibilityRole: 'header',
});

/**
 * Create accessible props for a checkbox
 * @param label - The label for the checkbox
 * @param isChecked - Current checked state
 * @param isDisabled - Whether the checkbox is disabled
 * @returns Accessibility props object
 */
export const createCheckboxA11y = (
  label: string,
  isChecked: boolean,
  isDisabled?: boolean
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: 'checkbox',
  accessibilityState: {
    checked: isChecked,
    disabled: isDisabled,
  },
});

/**
 * Create accessible props for a switch/toggle
 * @param label - The label for the switch
 * @param isOn - Current on/off state
 * @param isDisabled - Whether the switch is disabled
 * @returns Accessibility props object
 */
export const createSwitchA11y = (
  label: string,
  isOn: boolean,
  isDisabled?: boolean
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: 'switch',
  accessibilityState: {
    checked: isOn,
    disabled: isDisabled,
  },
});

/**
 * Create accessible props for a slider
 * @param label - The label for the slider
 * @param value - Current value
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Accessibility props object
 */
export const createSliderA11y = (
  label: string,
  value: number,
  min: number,
  max: number
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: 'adjustable',
  accessibilityValue: {
    min,
    max,
    now: value,
    text: `${value}`,
  },
  accessibilityActions: [
    { name: 'increment', label: 'Increase' },
    { name: 'decrement', label: 'Decrease' },
  ],
});

/**
 * Create accessible props for a tab
 * @param label - The label for the tab
 * @param isSelected - Whether the tab is currently selected
 * @returns Accessibility props object
 */
export const createTabA11y = (label: string, isSelected: boolean): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: 'tab',
  accessibilityState: {
    selected: isSelected,
  },
});

/**
 * Create accessible props for a loading indicator
 * @param message - Loading message
 * @returns Accessibility props object
 */
export const createLoadingA11y = (message: string = 'Loading'): A11yProps => ({
  accessible: true,
  accessibilityLabel: message,
  accessibilityRole: 'progressbar',
  accessibilityState: {
    busy: true,
  },
  accessibilityLiveRegion: 'polite',
});

/**
 * Create accessible props for an alert/notification
 * @param message - Alert message
 * @param isImportant - Whether to announce immediately (assertive) or politely
 * @returns Accessibility props object
 */
export const createAlertA11y = (
  message: string,
  isImportant: boolean = false
): A11yProps => ({
  accessible: true,
  accessibilityLabel: message,
  accessibilityRole: 'alert',
  accessibilityLiveRegion: isImportant ? 'assertive' : 'polite',
});

// ============================================================================
// TOUCH TARGET VALIDATION
// ============================================================================

/**
 * Check if a component meets minimum touch target size (44x44 per Apple/WCAG)
 * @param width - Component width
 * @param height - Component height
 * @returns Whether the component meets minimum touch target size
 */
export const meetsMinTouchTarget = (width: number, height: number): boolean => {
  const MIN_SIZE = 44;
  return width >= MIN_SIZE && height >= MIN_SIZE;
};

/**
 * Calculate padding needed to meet minimum touch target
 * @param currentSize - Current width or height
 * @returns Padding needed to reach 44pt
 */
export const calculateTouchTargetPadding = (currentSize: number): number => {
  const MIN_SIZE = 44;
  if (currentSize >= MIN_SIZE) return 0;
  return Math.ceil((MIN_SIZE - currentSize) / 2);
};

// ============================================================================
// COLOR CONTRAST VALIDATION
// ============================================================================

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance of a color
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color (hex)
 * @param color2 - Second color (hex)
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color combination meets WCAG AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether the combination meets WCAG AA
 */
export const meetsWCAGAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
};

/**
 * Check if color combination meets WCAG AAA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether the combination meets WCAG AAA
 */
export const meetsWCAGAAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
};

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

/**
 * Format a date for screen readers
 * @param date - Date to format
 * @returns Screen reader friendly date string
 */
export const formatDateForScreenReader = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a time for screen readers
 * @param date - Date to format
 * @returns Screen reader friendly time string
 */
export const formatTimeForScreenReader = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format a number with units for screen readers
 * @param value - Number value
 * @param unit - Unit of measurement
 * @returns Screen reader friendly string
 */
export const formatNumberWithUnit = (value: number, unit: string): string => {
  return `${value} ${unit}${value !== 1 ? 's' : ''}`;
};

/**
 * Format a percentage for screen readers
 * @param value - Percentage value (0-100)
 * @returns Screen reader friendly percentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)} percent`;
};

/**
 * Format a price for screen readers
 * @param amount - Price amount
 * @param currency - Currency code (default: USD)
 * @returns Screen reader friendly price
 */
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Create a focus trap for modals/dialogs
 * (Note: This is a simplified version - full implementation would need refs)
 */
export const createFocusTrap = () => {
  // This would be implemented with refs and event listeners
  // For now, just return the a11y props needed
  return {
    accessibilityViewIsModal: true,
    importantForAccessibility: 'yes' as const,
  };
};

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Standard keyboard event handlers for accessibility
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if an event is an activation key (Enter or Space)
 */
export const isActivationKey = (key: string): boolean => {
  return key === KEYBOARD_KEYS.ENTER || key === KEYBOARD_KEYS.SPACE;
};

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

/**
 * Create props for live region announcements
 * @param message - Message to announce
 * @param priority - Announcement priority
 * @returns Props for announcement component
 */
export const createAnnouncement = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): A11yProps => ({
  accessible: true,
  accessibilityLabel: message,
  accessibilityLiveRegion: priority,
  importantForAccessibility: 'yes',
});

// ============================================================================
// SEMANTIC GROUPING
// ============================================================================

/**
 * Create props for grouping related elements
 * @param label - Group label
 * @returns Props for container
 */
export const createGroup = (label?: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: 'none',
});

/**
 * Create props for a list container
 * @param itemCount - Number of items in the list
 * @returns Props for list container
 */
export const createList = (itemCount: number): A11yProps => ({
  accessible: true,
  accessibilityLabel: `List with ${itemCount} items`,
  accessibilityRole: 'list',
});

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

/**
 * Create accessible error message
 * @param fieldName - Name of the field with error
 * @param errorMessage - The error message
 * @returns Accessibility props for error
 */
export const createErrorA11y = (
  fieldName: string,
  errorMessage: string
): A11yProps => ({
  accessible: true,
  accessibilityLabel: `${fieldName} error: ${errorMessage}`,
  accessibilityRole: 'alert',
  accessibilityLiveRegion: 'assertive',
});

/**
 * Create accessible success message
 * @param message - Success message
 * @returns Accessibility props for success
 */
export const createSuccessA11y = (message: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: `Success: ${message}`,
  accessibilityRole: 'alert',
  accessibilityLiveRegion: 'polite',
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createButtonA11y,
  createInputA11y,
  createImageA11y,
  createLinkA11y,
  createHeadingA11y,
  createCheckboxA11y,
  createSwitchA11y,
  createSliderA11y,
  createTabA11y,
  createLoadingA11y,
  createAlertA11y,
  meetsMinTouchTarget,
  calculateTouchTargetPadding,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  formatDateForScreenReader,
  formatTimeForScreenReader,
  formatNumberWithUnit,
  formatPercentage,
  formatPrice,
  createFocusTrap,
  KEYBOARD_KEYS,
  isActivationKey,
  createAnnouncement,
  createGroup,
  createList,
  createErrorA11y,
  createSuccessA11y,
};
