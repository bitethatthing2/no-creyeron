-- Enable RLS on content_posts table
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own content_posts
CREATE POLICY "Users can insert their own content_posts" ON content_posts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view all content_posts
CREATE POLICY "Users can view all content_posts" ON content_posts
FOR SELECT TO authenticated
USING (true);

-- Allow users to update their own content_posts
CREATE POLICY "Users can update their own content_posts" ON content_posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);