'use client';

// Barrel export file for unified components
// Allows for cleaner imports in consuming components

// Core wrappers
export { ClientComponentWrapper, createClientComponent } from './ClientComponentWrapper';

// Import React for JSX in loading states

// Export UI components
// StatusBadge removed - OrderStatus type doesn't exist

// Export notification components - fix import paths
export { NotificationIndicator } from '../notifications/NotificationIndicator';
export { NotificationPopover } from '../notifications/NotificationPopover';
export { useNotifications, useSafeNotifications, NotificationProvider } from '../notifications/index';

// Export layout components
export {
  Header
} from './layout';

// Export table components
// Note: Table management components integrated into WolfPack system
