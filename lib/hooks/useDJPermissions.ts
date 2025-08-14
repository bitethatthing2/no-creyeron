import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface DJPermissions {
  canBroadcast: boolean;
  canCreateEvents: boolean;
  canModerateChat: boolean;
  isDJ: boolean;
  isActiveDJ: boolean;
}

export function useDJPermissions(): DJPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<DJPermissions>({
    canBroadcast: false,
    canCreateEvents: false,
    canModerateChat: false,
    isDJ: false,
    isActiveDJ: false,
  });

  useEffect(() => {
    async function checkDJPermissions() {
      if (!user) {
        setPermissions({
          canBroadcast: false,
          canCreateEvents: false,
          canModerateChat: false,
          isDJ: false,
          isActiveDJ: false,
        });
        return;
      }

      try {
        // Check if user has DJ role
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, permissions')
          .eq('id', user.id)
          .single();

        if (error || !userData) {
          setPermissions({
            canBroadcast: false,
            canCreateEvents: false,
            canModerateChat: false,
            isDJ: false,
          });
          return;
        }

        const isDJ = userData.role === 'dj';
        const isAdmin = userData.role === 'admin';
        
        setPermissions({
          canBroadcast: isDJ || isAdmin,
          canCreateEvents: isDJ || isAdmin,
          canModerateChat: isDJ || isAdmin,
          isDJ: isDJ,
          isActiveDJ: isDJ, // Same as isDJ for now
        });
      } catch (error) {
        console.error('Error checking DJ permissions:', error);
        setPermissions({
          canBroadcast: false,
          canCreateEvents: false,
          canModerateChat: false,
          isDJ: false,
          isActiveDJ: false,
        });
      }
    }

    checkDJPermissions();
  }, [user]);

  return permissions;
}