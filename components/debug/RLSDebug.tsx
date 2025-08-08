'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';

export function RLSDebug() {
  const { user: dbUser } = useConsistentAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const debug = async () => {
      if (!dbUser) return;

      try {
        // Get auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        // Check what the RLS policy query returns
        const { data: policyCheck, error: policyError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser?.id);

        // Try to insert a test record
        const { data: testInsert, error: insertError } = await supabase
          .from('wolfpack_videos')
          .insert({
            user_id: dbUser.id,
            title: 'Test Post',
            description: 'Test description',
            video_url: null,
            thumbnail_url: null,
            is_active: true
          })
          .select();

        setDebugInfo({
          dbUserId: dbUser.id,
          authUserId: authUser?.id,
          dbUserAuthId: dbUser.auth_id,
          policyCheck,
          policyError,
          authUserMatchesDbAuthId: authUser?.id === dbUser.auth_id,
          insertError: insertError?.message,
          testInsert
        });

        if (testInsert) {
          // Clean up test record
          await supabase
            .from('wolfpack_videos')
            .delete()
            .eq('id', testInsert[0].id);
        }

      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    debug();
  }, [dbUser]);

  if (!dbUser) {
    return <div className="fixed bottom-4 right-4 p-4 bg-red-800 text-white text-xs max-w-md z-50 rounded">
      No database user
    </div>;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white text-xs max-w-md z-50 rounded max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2">RLS Debug</h3>
      <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}