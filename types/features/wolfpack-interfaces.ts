// Wolfpack interface types
export interface WolfpackAccess {
  hasAccess: boolean;
  isWolfpackMember: boolean;
  tier?: string;
  reason?: string;
  wolfpackStatus?: WolfpackStatusType;
  locationStatus?: 'verified' | 'unverified' | 'pending';
  checkLocationPermission?: () => Promise<boolean>;
  refreshData?: () => Promise<void>;
}

export interface WolfpackFeatureFlags {
  enableVideoPosting: boolean;
  enableLiveChat: boolean;
  enableBroadcasts: boolean;
  enableFollowing: boolean;
}

export interface WolfpackPermissions {
  canPost: boolean;
  canComment: boolean;
  canLike: boolean;
  canMessage: boolean;
  canViewProfiles: boolean;
}

export type WolfpackStatusType = 'pending' | 'active' | 'inactive' | 'suspended';