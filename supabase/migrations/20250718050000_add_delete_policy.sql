-- Add DELETE policy for wolfpack_videos table
CREATE POLICY "Users can delete their own wolfpack wolfpack_videos"
    ON "public"."wolfpack_videos"
    FOR DELETE
    TO public
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));