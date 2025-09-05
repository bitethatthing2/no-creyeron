// Enhanced hooks using usehooks-ts
// These replace custom implementations with proven, tested hooks

// Core usehooks-ts re-exports with better names
export { 
  useLocalStorage, 
  useDebounceValue,
  useMediaQuery,
  useWindowSize,
  useOnClickOutside,
  useIntersectionObserver,
  useInterval,
  useReadLocalStorage
} from 'usehooks-ts';

// App-specific enhanced hooks
export { useRedirectAfterLogin } from '../useRedirectAfterLogin';
export { useEnhancedTyping } from '../useEnhancedTyping';
export { useVideoInView } from '../useVideoInView';
export { useAppWindowSize } from '../useAppWindowSize';
export { useResponsive } from '../useResponsive';

// App-specific localStorage hooks
export { 
  useRedirectUrl,
  useUserPreferences,
  useVideoSettings,
  useFeedScrollPosition,
  useChatDrafts,
  useMenuFavorites,
  useReadRedirectUrl,
  useReadUserPreferences,
  useAppStorage,
  APP_STORAGE_KEYS
} from '../useAppLocalStorage';

// Click outside hooks
export {
  useAppClickOutside,
  useCloseOnClickOutside,
  useMenuClickOutside,
  useModalClickOutside
} from '../useAppClickOutside';