-- Test script to add sample notifications for testing
-- This script creates sample notifications for development/testing purposes

-- Insert sample notifications for testing
-- Note: Replace 'test-user-id' with actual user IDs from your users table

-- Sample notification 1: Order ready notification
INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    message,
    link,
    read,
    data,
    created_at
) VALUES (
    'test-user-id',
    'order_ready',
    'Your order is ready!',
    'Your order #1234 is ready for pickup at the bar.',
    '/orders/1234',
    false,
    '{"orderId": "1234", "location": "bar"}',
    NOW() - INTERVAL '5 minutes'
);

-- Sample notification 2: New message notification
INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    message,
    link,
    read,
    data,
    created_at
) VALUES (
    'test-user-id',
    'message',
    'New message from Sarah',
    'You have a new message in Wolf Pack chat.',
    '/wolfpack/chat',
    false,
    '{"sender": "Sarah", "messageId": "msg-456"}',
    NOW() - INTERVAL '10 minutes'
);

-- Sample notification 3: System announcement
INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    message,
    link,
    read,
    data,
    created_at
) VALUES (
    'test-user-id',
    'announcement',
    'DJ Night Tonight!',
    'Join us for an amazing DJ night starting at 9 PM.',
    '/events/dj-night',
    false,
    '{"eventId": "dj-night-789", "startTime": "21:00"}',
    NOW() - INTERVAL '2 hours'
);

-- Sample notification 4: Read notification (for testing)
INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    message,
    link,
    read,
    data,
    created_at
) VALUES (
    'test-user-id',
    'info',
    'Welcome to High Energy Sports Bar!',
    'Thanks for joining our community. Check out our latest features.',
    '/welcome',
    true,
    '{"welcomeFlow": true}',
    NOW() - INTERVAL '1 day'
);

-- Query to test notifications
SELECT 
    id,
    recipient_id,
    type,
    title,
    message,
    link,
    read,
    data,
    created_at
FROM public.notifications
WHERE recipient_id = 'test-user-id'
ORDER BY created_at DESC;

-- Test functions
-- SELECT * FROM public.fetch_notifications('test-user-id', 10, 0);
-- SELECT public.mark_notification_read('notification-id-here');
-- SELECT public.mark_all_notifications_read();