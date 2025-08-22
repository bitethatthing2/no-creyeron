'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/services/feature-flags.service';

export function FeatureFlagDebug() {
  const { user, currentUser } = useAuth();
  const videoUploadFlag = useFeatureFlag(FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD);
  
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
        
        <div><strong>Video Upload Flag:</strong></div>
        <div>• Enabled: {videoUploadFlag.enabled ? '✅' : '❌'}</div>
        <div>• Loading: {videoUploadFlag.loading ? '🔄' : '✅'}</div>
        <div>• Reason: {videoUploadFlag.reason || 'N/A'}</div>
        {videoUploadFlag.error && (
          <div className="text-red-400">• Error: {videoUploadFlag.error.message}</div>
        )}
        
        {videoUploadFlag.flag_details && (
          <>
            <hr className="my-2" />
            <div><strong>Flag Details:</strong></div>
            <div>• Globally Enabled: {videoUploadFlag.flag_details.globally_enabled ? '✅' : '❌'}</div>
            <div>• User Role: {videoUploadFlag.flag_details.user_role || 'No role'}</div>
            <div>• Enabled Roles: {videoUploadFlag.flag_details.enabled_roles?.join(', ') || 'None'}</div>
          </>
        )}
      </div>
    </div>
  );
}