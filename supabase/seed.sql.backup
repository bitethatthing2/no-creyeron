-- Insert categories
INSERT INTO menu_categories (id, name, type, display_order) VALUES
('10921e3a-3ef4-4aa0-be00-b13a9d584ff2', 'BIRRIA', 'food', 2),
('3d7512d0-5de1-4d38-857c-ccb68f6449ff', 'Main', 'food', 4),
('063c35c0-0d8a-401b-8c4f-6937f0b9f814', 'Sides', 'food', 10),
('189d5ff5-624a-49ab-b0bf-35df993461ee', 'House Favorites', 'drink', 14),
('6f539351-ddbb-4dc5-b0c7-716822450806', 'BREAKFAST', 'food', 3),
('f3e366fc-c186-4fa7-ab88-a23e71ca4e1c', 'Specials', 'food', 8),
('ab52e655-78b9-47ad-934b-bca08c89ea96', 'Bottle Beer', 'drink', 19)
ON CONFLICT (id) DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (id, name, description, price, category_id, display_order, is_available, is_featured) VALUES
('0363f9db-7a2c-4419-af04-f67c9f6d2423', 'Birria Flautas', 'Corn tortilla filled with birria, served with consomme.', 12.00, '10921e3a-3ef4-4aa0-be00-b13a9d584ff2', 0, true, false),
('06ea8fa4-0bbd-414b-9763-adb8a4a51c79', 'Empanadas', 'Golden pastries filled with seasoned beef, chicken, or cheese. Served with salsa for dipping.', 7.00, '3d7512d0-5de1-4d38-857c-ccb68f6449ff', 0, true, false),
('08d69271-2e01-4d08-a5e4-c0f3478f97c3', 'Beans and Rice', 'Seasoned black beans and Mexican rice - the perfect complement to any meal.', 7.20, '063c35c0-0d8a-401b-8c4f-6937f0b9f814', 0, true, false),
('0b0eb4ca-6394-4dcd-a52b-81608731521d', 'Michelada', 'Beer, Michelada Mix, and Fresh Lime', 12.00, '189d5ff5-624a-49ab-b0bf-35df993461ee', 0, true, false),
('0dbfacbe-fa2e-4282-977e-eb0f9b11e8a9', 'Monchi Pancakes', 'Fluffy pancakes served with butter and maple syrup.', 15.00, '6f539351-ddbb-4dc5-b0c7-716822450806', 0, true, false),
('0ee91d36-37ea-4698-9e8d-2f3816ae39f1', 'Pork Chop Platter', 'Grilled pork chop served with rice, beans, and tortillas. A hearty traditional meal.', 18.00, 'f3e366fc-c186-4fa7-ab88-a23e71ca4e1c', 0, true, false),
('107b18d9-f91a-43e0-9a33-9ff8fac61870', 'Peachy Beachy', 'Titos, Champagne, and Peach syrup', 12.00, '189d5ff5-624a-49ab-b0bf-35df993461ee', 0, true, false),
('11013415-3463-469d-ad82-80c7eeebef49', 'Corona', 'Classic Mexican lager beer served ice cold', 5.00, 'ab52e655-78b9-47ad-934b-bca08c89ea96', 0, true, false),
('16ecb230-1cd1-4048-a424-be4d88a73e1e', 'Ham & Potato Breakfast Burrito', 'Breakfast burrito with scrambled eggs, ham, seasoned potatoes, cheese, and salsa.', 15.00, '6f539351-ddbb-4dc5-b0c7-716822450806', 0, true, true)
ON CONFLICT (id) DO NOTHING;