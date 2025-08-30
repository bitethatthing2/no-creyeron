/**
 * Centralized Z-Index Constants
 *
 * Defines all z-index values used throughout the application
 * to prevent overlay conflicts and maintain consistent layering.
 *
 * Hierarchy (from lowest to highest):
 * 1. Base content: 0-9
 * 2. Dropdowns/Tooltips: 10-19
 * 3. Fixed navigation: 20-29
 * 4. Sticky elements: 30-39
 * 5. Chat overlays: 40-49
 * 6. Modals/Dialogs: 50-59
 * 7. Notifications: 60-69
 * 8. Critical alerts: 70-79
 * 9. Debug overlays: 80-89
 * 10. Emergency: 90-99
 */

export const Z_INDEX = {
  // Base content (0-9)
  BASE: 0,
  CONTENT: 1,

  // Dropdowns and tooltips (10-19)
  DROPDOWN: 10,
  TOOLTIP: 15,

  // Fixed navigation (20-29)
  HEADER: 20,
  BOTTOM_NAV: 25,

  // Sticky elements (30-39)
  STICKY_ELEMENT: 30,
  CHAT_INPUT: 35,

  // Chat overlays (40-49)
  CHAT_TOAST: 40,
  MEMBER_POSITION: 42,
  MEMBER_POSITION_HOVER: 43,
  MEMBER_POSITION_ACTIVE: 44,
  MESSAGE_BUBBLE: 45,

  // Modals and dialogs (50-59)
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 51,
  PROFILE_POPUP: 52,
  USER_PROFILE_MODAL: 55,

  // Notifications (60-69)
  NOTIFICATION: 60,
  TOAST: 65,

  // Critical alerts (70-79)
  ALERT: 70,
  CRITICAL_OVERLAY: 75,

  // Debug overlays (80-89)
  DEBUG: 80,

  // Emergency (90-99)
  EMERGENCY: 99,
} as const;

// Type for z-index keys
export type ZIndexKey = keyof typeof Z_INDEX;

// CSS custom properties for use in CSS files
export const Z_INDEX_CSS_VARS = Object.entries(Z_INDEX).reduce(
  (acc, [key, value]) => {
    const cssVarName = `--z-${key.toLowerCase().replace(/_/g, "-")}`;
    acc[cssVarName] = value.toString();
    return acc;
  },
  {} as Record<string, string>,
);

// Utility functions
export const getZIndex = (layer: ZIndexKey): number => {
  return Z_INDEX[layer];
};

export const getZIndexStyle = (layer: ZIndexKey): React.CSSProperties => {
  return { zIndex: Z_INDEX[layer] };
};

// For Tailwind CSS arbitrary values
export const getZIndexClass = (layer: ZIndexKey): string => {
  return `z-[${Z_INDEX[layer]}]`;
};

// Apply all CSS variables to root element
export const applyZIndexCSSVars = (): void => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    Object.entries(Z_INDEX_CSS_VARS).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
};

// Check for z-index conflicts in development
export const checkZIndexConflicts = (): void => {
  if (process.env.NODE_ENV === "development") {
    const values = Object.values(Z_INDEX);
    const duplicates = values.filter((value, index) =>
      values.indexOf(value) !== index
    );

    if (duplicates.length > 0) {
      console.warn("Z-Index conflicts detected:", duplicates);

      // Find which keys have duplicate values
      const conflicts = Object.entries(Z_INDEX)
        .filter(([, value]) => duplicates.includes(value))
        .reduce((acc, [key, value]) => {
          if (!acc[value]) acc[value] = [];
          acc[value].push(key);
          return acc;
        }, {} as Record<number, string[]>);

      console.warn("Conflicting keys:", conflicts);
    }
  }
};
