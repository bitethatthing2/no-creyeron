import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { WolfpackAccess } from '@/types/features/wolfpack-interfaces';

export function useWolfpackAccess(): WolfpackAccess {
  const { user } = useAuth();
  const [access, setAccess] = useState<WolfpackAccess>({
    hasAccess: false,
    isWolfpackMember: false,
  });

  useEffect(() => {
    async function checkWolfpackAccess() {
      if (!user) {
        setAccess({
          hasAccess: false,
          isWolfpackMember: false,
          reason: 'Not authenticated',
        });
        return;
      }

      try {
        // Check if user is wolfpack member
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_wolfpack_member, wolfpack_status, wolfpack_tier')
          .eq('id', user.id)
          .single();

        if (error || !userData) {
          setAccess({
            hasAccess: false,
            isWolfpackMember: false,
            reason: 'User data not found',
          });
          return;
        }

        const isWolfpackMember = userData.is_wolfpack_member === true;
        const hasAccess = isWolfpackMember && userData.wolfpack_status === 'active';

        setAccess({
          hasAccess,
          isWolfpackMember,
          tier: userData.wolfpack_tier,
          reason: !hasAccess ? 'Not an active wolfpack member' : undefined,
        });
      } catch (error) {
        console.error('Error checking wolfpack access:', error);
        setAccess({
          hasAccess: false,
          isWolfpackMember: false,
          reason: 'Error checking access',
        });
      }
    }

    checkWolfpackAccess();
  }, [user]);

  return access;
}