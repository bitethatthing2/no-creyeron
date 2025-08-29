'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function FeatureFlagDebug() {
  const { user, currentUser } = useAuth();
  
  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🐛 Debug Info</h3>
      <div className="space-y-1">
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Role:</strong> {currentUser?.role || 'No role'}</div>
        <div><strong>Wolfpack Status:</strong> {currentUser?.wolfpackStatus || 'No status'}</div>
        <div><strong>Is Admin:</strong> {currentUser?.role === 'admin' ? '✅' : '❌'}</div>
        <div><strong>Active Member:</strong> {currentUser?.wolfpackStatus === 'active' ? '✅' : '❌'}</div>
        
        <hr className="my-2" />
        
        <div className="text-yellow-400">Feature flags disabled during cleanup</div>
      </div>
    </div>
  );
}