'use client';

import { useAuth } from '@/contexts/AuthContext';

export function AuthDebug() {
  const { user, currentUser, loading, isAuthenticated, isReady, error } = useAuth();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-0 right-0 bg-black/80 text-white p-2 text-xs z-50 max-w-xs">
      <div className="font-bold">Auth Debug</div>
      <div>Loading: {loading.toString()}</div>
      <div>Ready: {isReady.toString()}</div>
      <div>Authenticated: {isAuthenticated.toString()}</div>
      <div>Auth User: {user ? 'Yes' : 'No'}</div>
      <div>Profile: {currentUser ? 'Yes' : 'No'}</div>
      <div>Wolfpack Status: {currentUser?.wolfpackStatus || 'N/A'}</div>
      <div>Location: {currentUser?.location || 'N/A'}</div>
      {error && <div className="text-red-400">Error: {error.message}</div>}
    </div>
  );
}