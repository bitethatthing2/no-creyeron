import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
interface DJPermissions {
  canCreateEvents: boolean;
  canSendMassMessages: boolean;
  canSelectContestants: boolean;
  canManageVoting: boolean;
  assignedLocation: 'salem' | 'portland' | null;
  isActiveDJ: boolean;
  djId: string | null;
}

export function useDJPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<DJPermissions>({
    canCreateEvents: false,
    canSendMassMessages: false,
    canSelectContestants: false,
    canManageVoting: false,
    assignedLocation: null,
    isActiveDJ: false,
    djId: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!user) {
      setPermissions({
        canCreateEvents: false,
        canSendMassMessages: false,
        canSelectContestants: false,
        canManageVoting: false,
        assignedLocation: null,
        isActiveDJ: false,
        djId: null
      });
      setIsLoading(false);
      return;
    }

    const checkDJPermissions = async () => {
      if (!isMounted) return;
      try {        
        // Debug logging (development only)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 DJ Permissions Check:', {
            userEmail: user?.email,
            userId: user?.id
          });
        }
        
        // For now, we'll use a simple check - VIP users can be DJs
        // In production, this would check a proper DJ assignments table
        const vipUsers = ['mkahler599@gmail.com'];
        const isVipUser = user?.email && vipUsers.includes(user.email);
        
        // TEMP: Allow any authenticated user to access DJ dashboard for debugging
        const tempAllowAnyUser = true;

        if (isVipUser || tempAllowAnyUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 Setting DJ permissions for user:', { isVipUser, tempAllowAnyUser, userEmail: user?.email });
          }
          if (!isMounted) return;
          setPermissions({
            canCreateEvents: true,
            canSendMassMessages: true,
            canSelectContestants: true,
            canManageVoting: true,
            assignedLocation: 'salem', // Default to Salem for now
            isActiveDJ: true,
            djId: user?.id || null
          });
        } else {
          // Try to check for DJ assignment in database
          const { data: djData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .eq('is_active', true)
            .single();

          if (djData && 'location' in djData) {
            if (!isMounted) return;
            setPermissions({
              canCreateEvents: true,
              canSendMassMessages: true,
              canSelectContestants: true,
              canManageVoting: true,
              assignedLocation: djData.location as 'salem' | 'portland',
              isActiveDJ: true,
              djId: user?.id || null
            });
          }
        }
      } catch (error) {
        console.warn('Could not check DJ permissions (table may not exist yet):', error);
        // For development, allow VIP users to be DJs even if table doesn't exist
        const vipUsers = ['mkahler599@gmail.com'];
        const isVipUser = user?.email && vipUsers.includes(user.email);
        const tempAllowAnyUser = true;
        
        if (isVipUser || tempAllowAnyUser) {
          console.log('🎯 Setting DJ permissions (catch block) for user:', { isVipUser, tempAllowAnyUser, userEmail: user?.email });
          if (!isMounted) return;
          setPermissions({
            canCreateEvents: true,
            canSendMassMessages: true,
            canSelectContestants: true,
            canManageVoting: true,
            assignedLocation: 'salem',
            isActiveDJ: true,
            djId: user?.id || null
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkDJPermissions();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  return { ...permissions, isLoading };
}
