'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clearBrowserImageCache } from '@/lib/utils/image-cache';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';

export default function DevCachePage() {
  const [status, setStatus] = useState<string>('');
  const [serviceWorkers, setServiceWorkers] = useState<ServiceWorkerRegistration[]>([]);
  const [caches, setCaches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Only allow in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      window.location.href = '/';
    }
  }, []);

  // Load service workers and caches
  const loadInfo = async () => {
    try {
      // Get service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        setServiceWorkers(registrations);
      }

      // Get cache names
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        setCaches(cacheNames);
      }
    } catch (error) {
      console.error('Error loading info:', error);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const unregisterServiceWorker = async (registration: ServiceWorkerRegistration) => {
    setIsLoading(true);
    try {
      await registration.unregister();
      setStatus('✅ Service worker unregistered');
      await loadInfo();
    } catch (error) {
      setStatus('❌ Failed to unregister service worker');
    }
    setIsLoading(false);
  };

  const deleteCache = async (cacheName: string) => {
    setIsLoading(true);
    try {
      await caches.delete(cacheName);
      setStatus(`✅ Deleted cache: ${cacheName}`);
      await loadInfo();
    } catch (error) {
      setStatus(`❌ Failed to delete cache: ${cacheName}`);
    }
    setIsLoading(false);
  };

  const clearAllCaches = async () => {
    setIsLoading(true);
    try {
      await clearBrowserImageCache();
      setStatus('✅ All caches cleared - page will reload');
    } catch (error) {
      setStatus('❌ Failed to clear caches');
      setIsLoading(false);
    }
  };

  const unregisterAllServiceWorkers = async () => {
    setIsLoading(true);
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      setStatus('✅ All service workers unregistered');
      await loadInfo();
    } catch (error) {
      setStatus('❌ Failed to unregister service workers');
    }
    setIsLoading(false);
  };

  const hardRefresh = () => {
    // Clear everything and hard reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">
          🛠️ Development Cache Control
        </h1>

        {status && (
          <div className="mb-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
            {status}
          </div>
        )}

        <div className="grid gap-6">
          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button
                onClick={hardRefresh}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Hard Refresh (Clear Everything)
              </Button>
              
              <Button
                onClick={clearAllCaches}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Caches
              </Button>
              
              <Button
                onClick={unregisterAllServiceWorkers}
                disabled={isLoading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Unregister All Service Workers
              </Button>
            </CardContent>
          </Card>

          {/* Service Workers */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Service Workers ({serviceWorkers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceWorkers.length === 0 ? (
                <p className="text-gray-400">No service workers registered</p>
              ) : (
                <div className="space-y-2">
                  {serviceWorkers.map((sw, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded"
                    >
                      <div>
                        <p className="text-sm font-mono">{sw.scope}</p>
                        <p className="text-xs text-gray-400">
                          State: {sw.active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => unregisterServiceWorker(sw)}
                        disabled={isLoading}
                      >
                        Unregister
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caches */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Browser Caches ({caches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caches.length === 0 ? (
                <p className="text-gray-400">No caches found</p>
              ) : (
                <div className="space-y-2">
                  {caches.map((cache) => (
                    <div
                      key={cache}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded"
                    >
                      <p className="text-sm font-mono">{cache}</p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCache(cache)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <p>🔄 <strong>Hard Refresh:</strong> Clears all storage and reloads</p>
              <p>🗑️ <strong>Clear Caches:</strong> Removes all browser caches</p>
              <p>⚠️ <strong>Unregister Service Workers:</strong> Disables offline caching</p>
              <p className="mt-4 text-yellow-400">
                After making image changes, use "Hard Refresh" for immediate updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}