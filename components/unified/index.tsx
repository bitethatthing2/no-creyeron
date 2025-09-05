'use client';

// Barrel export file for unified components
// Allows for cleaner imports in consuming components

// Core wrappers
export { ClientComponentWrapper, createClientComponent } from './ClientComponentWrapper';

// Import React for JSX in loading states

// Export UI components
// StatusBadge removed - OrderStatus type doesn't exist

// Notification components were removed during cleanup
// Use NotificationBell from components/NotificationBell.tsx instead

// Export layout components
export {
  Header
} from './layout';

// Export table components
// Note: Table management components integrated into WolfPack system
