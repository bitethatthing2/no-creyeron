// Chat Sessions Configuration
// Simple frontend-only configuration for chat sessions

export interface ChatSession {
  id: string;
  name: string;
  description: string;
  locationId?: string;
  icon: string;
}

export const CHAT_SESSIONS: Record<string, ChatSession> = {
  general: {
    id: 'general',
    name: 'General Chat',
    description: 'Main wolfpack chat for all locations',
    icon: '🌍'
  },
  salem: {
    id: 'salem',
    name: 'Salem Wolfpack',
    description: 'Salem location chat',
    locationId: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    icon: '📍'
  },
  portland: {
    id: 'portland',
    name: 'Portland Wolfpack',
    description: 'Portland location chat',
    locationId: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    icon: '📍'
  },
  events: {
    id: 'events',
    name: 'Events',
    description: 'Event discussions and announcements',
    icon: '🎉'
  },
  music: {
    id: 'music',
    name: 'Music Requests',
    description: 'DJ song requests and music chat',
    icon: '🎵'
  }
};

// Helper function to get session by location ID
export const getSessionByLocationId = (locationId: string): ChatSession => {
  return Object.values(CHAT_SESSIONS).find(
    session => session.locationId === locationId
  ) || CHAT_SESSIONS.general;
};

// Helper function to get session by ID
export const getSessionById = (sessionId: string): ChatSession | null => {
  return CHAT_SESSIONS[sessionId] || null;
};

// Get all available sessions
export const getAllSessions = (): ChatSession[] => {
  return Object.values(CHAT_SESSIONS);
};