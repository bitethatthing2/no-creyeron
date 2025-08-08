// lib/types/wolfpack-status.ts

export type WolfpackStatus = 
  | { status: 'loading'; isChecking: true; isLoading: true; isMember: false; isWolfpackMember: false; isLocationVerified: false }
  | { status: 'active'; isChecking: false; isLoading: false; isMember: true; isWolfpackMember: true; isLocationVerified: boolean }
  | { status: 'not_member'; isChecking: false; isLoading: false; isMember: false; isWolfpackMember: false; isLocationVerified: false }
  | { status: 'pending'; isChecking: false; isLoading: false; isMember: false; isWolfpackMember: false; isLocationVerified: false }
  | { status: 'inactive'; isChecking: false; isLoading: false; isMember: false; isWolfpackMember: false; isLocationVerified: false }
  | { status: 'suspended'; isChecking: false; isLoading: false; isMember: false; isWolfpackMember: false; isLocationVerified: false };

export type LocationStatus = 
  | { status: 'loading'; isChecking: true }
  | { status: 'verified'; isChecking: false }
  | { status: 'not-verified'; isChecking: false }
  | { status: 'error'; isChecking: false };

// Helper function to check if user has wolfpack access
export function hasWolfpackAccess(status: WolfpackStatus): boolean {
  return status.isMember || status.isWolfpackMember;
}

// Helper function to check if location is verified
export function isLocationVerified(status: WolfpackStatus): boolean {
  return status.isLocationVerified;
}
