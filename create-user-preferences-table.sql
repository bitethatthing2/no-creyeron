-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    favorite_content_types TEXT[] DEFAULT ARRAY['social', 'event', 'business'],
    favorite_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    interaction_patterns JSONB DEFAULT '{
        "most_active_hours": [19, 20, 21, 22],
        "preferred_media_types": ["image", "video"],
        "engagement_rate": 0.3
    }'::JSONB,
    location_preferences JSONB DEFAULT '{
        "salem": true,
        "portland": true,
        "radius_miles": 25
    }'::JSONB,
    interests TEXT[] DEFAULT ARRAY['music', 'food', 'events', 'nightlife'],
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);