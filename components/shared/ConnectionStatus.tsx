'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';

export function ConnectionStatus() {
  const [status, setStatus] = React.useState<'connected' | 'connecting' | 'error'>('connecting');
  const [isVisible, setIsVisible] = React.useState(true);
  
  React.useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        // Simple query to test connection
        const { error } = await supabase.from('users').select('count').limit(1);
        setStatus(error ? 'error' : 'connected');
      } catch {
        setStatus('error');
      }
    };
    
    // Initial check
    checkConnection();
    
    // Periodic check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-hide success status after 3 seconds
  React.useEffect(() => {
    if (status === 'connected') {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [status]);
  
  if (!isVisible && status === 'connected') return null;
  
  const statusConfig = {
    connecting: {
      bg: 'bg-yellow-500',
      text: '🔄 Connecting...',
      textColor: 'text-white'
    },
    connected: {
      bg: 'bg-green-500',
      text: '✅ Connected',
      textColor: 'text-white'
    },
    error: {
      bg: 'bg-red-500',
      text: '⚠️ Connection Issue',
      textColor: 'text-white'
    }
  };

  const config = statusConfig[status];
  
  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm ${config.bg} ${config.textColor} z-50 shadow-lg transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className="flex items-center gap-2">
        <span>{config.text}</span>
        {status === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}