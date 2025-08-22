-- Add DELETE policy for content_posts table
CREATE POLICY "Users can delete their own wolfpack content_posts"
    ON "public"."content_posts"
    FOR DELETE
    TO public
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));