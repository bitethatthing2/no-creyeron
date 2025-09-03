import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createAdminClient();

    // SQL commands to fix storage RLS policies
    const sqlCommands = [
      // First, ensure buckets exist
      `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
       VALUES 
         ('content', 'content', true, 52428800, '{"image/*","video/*"}'),
         ('avatars', 'avatars', true, 5242880, '{"image/*"}'),
         ('videos', 'videos', true, 104857600, '{"video/*"}'),
         ('thumbnails', 'thumbnails', true, 5242880, '{"image/*"}')
       ON CONFLICT (id) DO UPDATE SET
         public = EXCLUDED.public,
         file_size_limit = EXCLUDED.file_size_limit,
         allowed_mime_types = EXCLUDED.allowed_mime_types;`,

      // Drop existing policies if they exist (ignore errors)
      `DROP POLICY IF EXISTS "Users can upload to content bucket" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Anyone can view content files" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Anyone can view thumbnails" ON storage.objects;`,

      // Enable RLS on storage.objects (if not already enabled)
      `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,

      // Create storage policies for content bucket
      `CREATE POLICY "Users can upload to content bucket" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'content' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Anyone can view content files" ON storage.objects
       FOR SELECT USING (bucket_id = 'content');`,

      `CREATE POLICY "Users can update content files" ON storage.objects
       FOR UPDATE USING (
         bucket_id = 'content' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,

      `CREATE POLICY "Users can delete content files" ON storage.objects
       FOR DELETE USING (
         bucket_id = 'content' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,

      // Create storage policies for avatars bucket
      `CREATE POLICY "Users can upload avatars" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'avatars' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Anyone can view avatars" ON storage.objects
       FOR SELECT USING (bucket_id = 'avatars');`,

      `CREATE POLICY "Users can update avatars" ON storage.objects
       FOR UPDATE USING (
         bucket_id = 'avatars' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,

      // Create storage policies for videos bucket
      `CREATE POLICY "Users can upload videos" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'videos' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Anyone can view videos" ON storage.objects
       FOR SELECT USING (bucket_id = 'videos');`,

      // Create storage policies for thumbnails bucket
      `CREATE POLICY "Users can upload thumbnails" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'thumbnails' AND 
         auth.uid()::text = (storage.foldername(name))[1]
       );`,
       
      `CREATE POLICY "Anyone can view thumbnails" ON storage.objects
       FOR SELECT USING (bucket_id = 'thumbnails');`
    ];

    const results = [];
    
    for (const sql of sqlCommands) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: sql
        });
        
        results.push({
          command: sql.split('\n')[0].trim() + '...',
          success: !error,
          error: error?.message || null,
          data: data
        });
      } catch (err) {
        // Try alternative method if exec_sql doesn't exist
        try {
          // For some commands, we can use direct operations
          if (sql.includes('INSERT INTO storage.buckets')) {
            // Handle bucket creation differently
            const buckets = [
              { id: 'content', name: 'content', public: true },
              { id: 'avatars', name: 'avatars', public: true },
              { id: 'videos', name: 'videos', public: true },
              { id: 'thumbnails', name: 'thumbnails', public: true }
            ];
            
            for (const bucket of buckets) {
              const { error } = await supabase.storage.createBucket(bucket.id, {
                public: bucket.public,
                fileSizeLimit: bucket.id === 'videos' ? 104857600 : (bucket.id === 'content' ? 52428800 : 5242880),
                allowedMimeTypes: bucket.id === 'videos' ? ['video/*'] : (bucket.id === 'avatars' || bucket.id === 'thumbnails' ? ['image/*'] : ['image/*', 'video/*'])
              });
              
              if (error && !error.message.includes('already exists')) {
                console.error(`Error creating bucket ${bucket.id}:`, error);
              }
            }
            
            results.push({
              command: 'Create storage buckets',
              success: true,
              error: null
            });
          } else {
            results.push({
              command: sql.split('\n')[0].trim() + '...',
              success: false,
              error: `RPC not available: ${err}`
            });
          }
        } catch (altErr) {
          results.push({
            command: sql.split('\n')[0].trim() + '...',
            success: false,
            error: `Failed: ${altErr}`
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Storage RLS policies setup attempted',
      results
    });

  } catch (error) {
    console.error('Error setting up storage RLS policies:', error);
    return NextResponse.json(
      { error: 'Failed to setup storage RLS policies', details: String(error) },
      { status: 500 }
    );
  }
}