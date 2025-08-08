-- Fix the image path for Single Queso Taco to match the correct image
-- This updates the database to show queso-tacos.png for Single Queso Taco

UPDATE menu_items 
SET image_url = '/food-menu-images/queso-tacos.png'
WHERE name = 'Single Queso Taco';

-- Verify the update
SELECT id, name, image_url 
FROM menu_items 
WHERE name IN ('Single Queso Taco', 'Birria Queso Tacos');