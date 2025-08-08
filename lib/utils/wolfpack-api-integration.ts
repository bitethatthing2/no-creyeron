// lib/utils/wolfpack-api-integration.ts
/**
 * Integration utilities for the new Wolfpack API system
 * Provides helper functions to work with the new API endpoints
 */

export interface WolfpackApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface WolfpackMember {
  id: string;
  location_id: string;
  display_name: string;
  emoji: string;
  current_vibe: string;
  table_location?: string;
  joined_at: string;
  last_active: string;
  is_active: boolean;
}

export interface WolfpackLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface WolfpackStatus {
  isMember: boolean;
  membership?: WolfpackMember;
  location?: WolfpackLocation;
  databaseUserId?: string;
}

/**
 * Client-side API wrapper for Wolfpack endpoints
 */
export class WolfpackApiClient {
  private baseUrl = '/api/wolfpack';

  /**
   * Join a wolfpack at a specific location
   */
  async joinPack(params: {
    location_id: string;
    display_name?: string;
    current_vibe?: string;
    table_location?: string;
  }): Promise<WolfpackApiResponse<WolfpackMember>> {
    try {
      const response = await fetch(`${this.baseUrl}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Leave the current wolfpack
   */
  async leavePack(): Promise<WolfpackApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/leave`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Get current wolfpack status
   */
  async getStatus(): Promise<WolfpackApiResponse<WolfpackStatus>> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Get members of a wolfpack at a location
   */
  async getMembers(locationId: string): Promise<WolfpackApiResponse<{
    members: WolfpackMember[];
    location_id: string;
    current_id: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/members?location_id=${locationId}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Update wolfpack membership details
   */
  async updateMembership(updates: {
    table_location?: string;
    current_vibe?: string;
    display_name?: string;
  }): Promise<WolfpackApiResponse<WolfpackMember>> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }
}

/**
 * React hook for using the Wolfpack API
 */
export function useWolfpackApi() {
  const client = new WolfpackApiClient();

  return {
    joinPack: client.joinPack.bind(client),
    leavePack: client.leavePack.bind(client),
    getStatus: client.getStatus.bind(client),
    getMembers: client.getMembers.bind(client),
    updateMembership: client.updateMembership.bind(client),
  };
}

/**
 * Error code mapping for user-friendly messages
 */
export const WOLFPACK_ERROR_MESSAGES = {
  AUTH_ERROR: 'Please log in to access the wolfpack',
  USER_NOT_FOUND: 'User account not found. Please try logging in again.',
  ALREADY_MEMBER: 'You are already in a wolfpack',
  LOCATION_NOT_FOUND: 'Location not found',
  ACCESS_DENIED: 'You do not have access to this wolfpack',
  VALIDATION_ERROR: 'Invalid input provided',
  JOIN_ERROR: 'Failed to join wolfpack. Please try again.',
  LEAVE_ERROR: 'Failed to leave wolfpack. Please try again.',
  UPDATE_ERROR: 'Failed to update membership. Please try again.',
  MEMBERSHIP_ERROR: 'Failed to check membership status',
  MEMBERS_ERROR: 'Failed to load wolfpack members',
  NETWORK_ERROR: 'Network connection error. Please check your internet.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
} as const;

/**
 * Get user-friendly error message from API response
 */
export function getErrorMessage(response: WolfpackApiResponse): string {
  if (response.success) return '';
  
  const code = response.code as keyof typeof WOLFPACK_ERROR_MESSAGES;
  return WOLFPACK_ERROR_MESSAGES[code] || response.error || 'An unexpected error occurred';
}