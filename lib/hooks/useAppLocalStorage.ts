import { useLocalStorage, useReadLocalStorage } from 'usehooks-ts';

// App-specific localStorage keys
export const APP_STORAGE_KEYS = {
  REDIRECT_AFTER_LOGIN: 'redirectAfterLogin',
  USER_PREFERENCES: 'userPreferences',
  THEME_PREFERENCE: 'themePreference', 
  VIDEO_PLAYBACK_SETTINGS: 'videoPlaybackSettings',
  FEED_SCROLL_POSITION: 'feedScrollPosition',
  CHAT_DRAFT_MESSAGES: 'chatDraftMessages',
  NOTIFICATION_PERMISSIONS: 'notificationPermissions',
  LAST_LOCATION: 'lastLocation',
  MENU_FAVORITES: 'menuFavorites',
  APP_SETTINGS: 'appSettings'
} as const;

// Type-safe localStorage hooks for common app data
export function useRedirectUrl() {
  return useLocalStorage<string | null>(APP_STORAGE_KEYS.REDIRECT_AFTER_LOGIN, null);
}

export function useUserPreferences() {
  return useLocalStorage(APP_STORAGE_KEYS.USER_PREFERENCES, {
    autoPlayVideos: true,
    showNotifications: true,
    darkMode: false,
    compactView: false
  });
}

export function useVideoSettings() {
  return useLocalStorage(APP_STORAGE_KEYS.VIDEO_PLAYBACK_SETTINGS, {
    autoplay: true,
    muted: false,
    loop: true,
    quality: 'auto' as 'auto' | 'high' | 'medium' | 'low'
  });
}

export function useFeedScrollPosition() {
  return useLocalStorage<number>(APP_STORAGE_KEYS.FEED_SCROLL_POSITION, 0);
}

export function useChatDrafts() {
  return useLocalStorage<Record<string, string>>(APP_STORAGE_KEYS.CHAT_DRAFT_MESSAGES, {});
}

export function useMenuFavorites() {
  return useLocalStorage<string[]>(APP_STORAGE_KEYS.MENU_FAVORITES, []);
}

// Read-only hooks for performance
export function useReadRedirectUrl() {
  return useReadLocalStorage<string | null>(APP_STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
}

export function useReadUserPreferences() {
  return useReadLocalStorage(APP_STORAGE_KEYS.USER_PREFERENCES);
}

// Generic hook for any localStorage key
export function useAppStorage<T>(key: string, defaultValue: T) {
  return useLocalStorage<T>(key, defaultValue);
}