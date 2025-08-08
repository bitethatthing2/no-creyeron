'use client';

import { useEffect, useState, useCallback, useReducer } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { notificationService } from '@/lib/services/notification.service';

interface NotificationState {
  isEnabled: boolean;
  isInitialized: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

type NotificationAction = 
  | { type: 'SET_INITIAL_STATE'; payload: { enabled: boolean; initialized: boolean; hasPermission: boolean; } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENABLED'; payload: { enabled: boolean; initialized: boolean; hasPermission: boolean; } };

const initialState: NotificationState = {
  isEnabled: false,
  isInitialized: false,
  hasPermission: false,
  isLoading: false,
  error: null,
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return {
        ...state,
        isEnabled: action.payload.enabled,
        isInitialized: action.payload.initialized,
        hasPermission: action.payload.hasPermission,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ENABLED':
      return {
        ...state,
        isEnabled: action.payload.enabled,
        isInitialized: action.payload.initialized,
        hasPermission: action.payload.hasPermission,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

interface UseNotificationsReturn extends NotificationState {
  enableNotifications: () => Promise<boolean>;
  sendNotification: (userId: string, payload: any) => Promise<boolean>;
  subscribeToTopic: (topicKey: string) => Promise<boolean>;
  unsubscribeFromTopic: (topicKey: string) => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useSupabase();
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Check initial state
  useEffect(() => {
    const checkInitialState = () => {
      const enabled = notificationService.isNotificationEnabled();
      const initialized = notificationService.getIsInitialized();
      
      dispatch({
        type: 'SET_INITIAL_STATE',
        payload: { enabled, initialized, hasPermission: enabled }
      });
    };

    checkInitialState();
  }, []);

  // Initialize notifications when user is available
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user || state.isInitialized) return;

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const success = await notificationService.initialize(user.id);
        dispatch({
          type: 'SET_ENABLED',
          payload: { enabled: success, initialized: success, hasPermission: success }
        });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to initialize notifications'
        });
      }
    };

    initializeNotifications();
  }, [user, state.isInitialized]);

  // Enable notifications (request permission and initialize)
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Request permission first
      const permissionGranted = await notificationService.requestPermission();
      if (!permissionGranted) {
        throw new Error('Notification permission denied');
      }

      // Initialize service
      const success = await notificationService.initialize(user?.id);
      
      dispatch({
        type: 'SET_ENABLED',
        payload: { enabled: success, initialized: success, hasPermission: permissionGranted }
      });
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  }, [user?.id]);

  // Send notification
  const sendNotification = useCallback(async (userId: string, payload: any): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      return await notificationService.sendNotification(userId, payload);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  }, []);

  // Subscribe to topic
  const subscribeToTopic = useCallback(async (topicKey: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      return await notificationService.subscribeToTopic(topicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to topic';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  }, []);

  // Unsubscribe from topic
  const unsubscribeFromTopic = useCallback(async (topicKey: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      return await notificationService.unsubscribeFromTopic(topicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from topic';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  }, []);

  return {
    ...state,
    enableNotifications,
    sendNotification,
    subscribeToTopic,
    unsubscribeFromTopic
  };
}