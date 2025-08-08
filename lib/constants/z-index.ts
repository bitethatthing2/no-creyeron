/**
 * Centralized Z-Index Constants
 * 
 * This file defines all z-index values used throughout the application
 * to prevent overlay conflicts and maintain a consistent layering hierarchy.
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
 * 10. Max priority: 90-99
 */

export const Z_INDEX = {
  // Base content (0-9)
  BASE: 0,
  CONTENT: 1,
  
  // Dropdowns and tooltips (10-19)
  DROPDOWN: 10,
  TOOLTIP: 15,
  
  // Fixed navigation (20-29)
  BOTTOM_NAV: 100, // Increased to ensure it's always on top
  HEADER: 25,
  
  // Sticky elements (30-39)
  STICKY_ELEMENT: 30,
  CHAT_INPUT: 35,
  
  // Chat overlays (40-49)
  CHAT_TOAST: 40,
  MEMBER_POSITION: 45,
  MEMBER_POSITION_HOVER: 46,
  MEMBER_POSITION_ACTIVE: 47,
  
  // Modals and dialogs (50-59)
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 51,
  PROFILE_POPUP: 55,
  USER_PROFILE_MODAL: 58,
  
  // Notifications (60-69)
  NOTIFICATION: 60,
  TOAST: 65,
  
  // Critical alerts (70-79)
  ALERT: 70,
  
  // Debug overlays (80-89)
  DEBUG: 80,
  
  // Chat elements (90-99)
  MESSAGE_BUBBLE: 90,
  
  // Max priority (100-999)
  CRITICAL_OVERLAY: 100,
  USER_PROFILE_MODAL_OVERRIDE: 999,
  EMERGENCY: 9999
} as const;

// CSS custom properties for use in CSS files
export const Z_INDEX_CSS_VARS = {
  '--z-base': Z_INDEX.BASE.toString(),
  '--z-content': Z_INDEX.CONTENT.toString(),
  '--z-dropdown': Z_INDEX.DROPDOWN.toString(),
  '--z-tooltip': Z_INDEX.TOOLTIP.toString(),
  '--z-bottom-nav': Z_INDEX.BOTTOM_NAV.toString(),
  '--z-header': Z_INDEX.HEADER.toString(),
  '--z-sticky-element': Z_INDEX.STICKY_ELEMENT.toString(),
  '--z-chat-input': Z_INDEX.CHAT_INPUT.toString(),
  '--z-chat-toast': Z_INDEX.CHAT_TOAST.toString(),
  '--z-member-position': Z_INDEX.MEMBER_POSITION.toString(),
  '--z-member-position-hover': Z_INDEX.MEMBER_POSITION_HOVER.toString(),
  '--z-member-position-active': Z_INDEX.MEMBER_POSITION_ACTIVE.toString(),
  '--z-modal-backdrop': Z_INDEX.MODAL_BACKDROP.toString(),
  '--z-modal-content': Z_INDEX.MODAL_CONTENT.toString(),
  '--z-profile-popup': Z_INDEX.PROFILE_POPUP.toString(),
  '--z-notification': Z_INDEX.NOTIFICATION.toString(),
  '--z-toast': Z_INDEX.TOAST.toString(),
  '--z-alert': Z_INDEX.ALERT.toString(),
  '--z-debug': Z_INDEX.DEBUG.toString(),
  '--z-message-bubble': Z_INDEX.MESSAGE_BUBBLE.toString(),
  '--z-critical-overlay': Z_INDEX.CRITICAL_OVERLAY.toString(),
  '--z-emergency': Z_INDEX.EMERGENCY.toString()
} as const;

// Utility functions
export const getZIndex = (layer: keyof typeof Z_INDEX): number => {
  return Z_INDEX[layer];
};

export const getZIndexStyle = (layer: keyof typeof Z_INDEX): { zIndex: number } => {
  return { zIndex: Z_INDEX[layer] };
};

export const getZIndexClass = (layer: keyof typeof Z_INDEX): string => {
  return `z-[${Z_INDEX[layer]}]`;
};