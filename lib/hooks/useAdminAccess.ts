'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useAdminAccess() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdminStatus() {
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Try to check admin status from email first (fallback)
        const adminEmails = ['gthabarber1@gmail.com', 'mkahler599@gmail.com'];
        const isAdminByEmail = user?.email && adminEmails.includes(user.email);
        
        if (isAdminByEmail) {
          if (mounted) {
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        // Try to check from database
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();

        if (mounted) {
          if (error) {
            console.log('Admin check failed, using email fallback:', error?.message || error);
            setIsAdmin(isAdminByEmail);
          } else {
            // Check if user has admin or super_admin role
            const isAdminRole = data?.role === 'admin' || data?.role === 'super_admin';
            setIsAdmin(isAdminRole || isAdminByEmail);
          }
          setLoading(false);
        }
      } catch (err) {
        console.log('Admin check failed, using email fallback:', err);
        if (mounted) {
          const adminEmails = ['gthabarber1@gmail.com', 'mkahler599@gmail.com'];
          const isAdminByEmail = user?.email && adminEmails.includes(user.email);
          setIsAdmin(isAdminByEmail);
          setLoading(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { isAdmin, loading };
}