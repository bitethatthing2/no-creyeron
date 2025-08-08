-- Firebase Push Notification System Setup
-- Run this in your Supabase SQL editor

-- 1. Device Tokens Table
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    device_name TEXT,
    device_model TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used TIMESTAMPTZ DEFAULT now(),
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    registration_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(token, user_id)
);

-- 2. Push Notifications Table
CREATE TABLE IF NOT EXISTS push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_token_id UUID REFERENCES device_tokens(id) ON DELETE SET NULL,
    announcement_id UUID REFERENCES announcements(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (length(title) <= 100),
    body TEXT NOT NULL CHECK (length(body) <= 1000),
    data JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    firebase_message_id TEXT,
    link TEXT,
    type TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- 3. Notification Topics Table
CREATE TABLE IF NOT EXISTS notification_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_role TEXT CHECK (requires_role IN ('admin', 'bartender', 'dj', 'user', NULL)),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Topic Subscriptions Table
CREATE TABLE IF NOT EXISTS user_topic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES notification_topics(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, topic_id)
);

-- 5. Secure Credentials Table (for Firebase service account)
CREATE TABLE IF NOT EXISTS secure_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE,
    credentials JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Update users table to add notification preferences
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "events": true,
    "marketing": false,
    "announcements": true,
    "chat_messages": true,
    "order_updates": true,
    "member_activity": true,
    "social_interactions": true
}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active ON device_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status_retry ON push_notifications(status, retry_count);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_status ON push_notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences ON users USING gin(notification_preferences);
CREATE INDEX IF NOT EXISTS idx_user_topic_subscriptions_user ON user_topic_subscriptions(user_id, is_active);

-- Insert default notification topics
INSERT INTO notification_topics (topic_key, display_name, description) VALUES
('events', 'Events & Activities', 'DJ events, contests, and special activities'),
('marketing', 'Promotions & Offers', 'Marketing content and special offers'),
('announcements', 'Important Updates', 'Important announcements from staff'),
('chat_messages', 'Chat Messages', 'Private messages and chat notifications'),
('order_updates', 'Order Updates', 'Order status and pickup notifications'),
('member_activity', 'Member Activity', 'Wolfpack member interactions'),
('social_interactions', 'Social Interactions', 'Winks, profile views, and social features')
ON CONFLICT (topic_key) DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_credentials ENABLE ROW LEVEL SECURITY;

-- Device tokens policies
CREATE POLICY "Users can view their own device tokens" ON device_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device tokens" ON device_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens" ON device_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all device tokens" ON device_tokens
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Push notifications policies
CREATE POLICY "Users can view their own push notifications" ON push_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all push notifications" ON push_notifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Notification topics policies
CREATE POLICY "Anyone can view active notification topics" ON notification_topics
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notification topics" ON notification_topics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User topic subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON user_topic_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" ON user_topic_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Secure credentials policies (service role only)
CREATE POLICY "Service role only access" ON secure_credentials
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_device_tokens_updated_at 
    BEFORE UPDATE ON device_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_topics_updated_at 
    BEFORE UPDATE ON notification_topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secure_credentials_updated_at 
    BEFORE UPDATE ON secure_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old/invalid device tokens
CREATE OR REPLACE FUNCTION cleanup_device_tokens()
RETURNS void AS $$
BEGIN
    -- Deactivate tokens with high error counts (5+)
    UPDATE device_tokens 
    SET is_active = false, updated_at = now()
    WHERE error_count >= 5 AND is_active = true;
    
    -- Delete very old inactive tokens (90+ days)
    DELETE FROM device_tokens 
    WHERE is_active = false 
    AND updated_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE device_tokens IS 'Stores FCM device tokens for push notifications';
COMMENT ON TABLE push_notifications IS 'Individual push notification records and delivery status';
COMMENT ON TABLE notification_topics IS 'Available notification categories for user subscriptions';
COMMENT ON TABLE user_topic_subscriptions IS 'User subscriptions to notification topics';
COMMENT ON TABLE secure_credentials IS 'Secure storage for Firebase service account credentials';