-- Create the missing menu_items_with_working_modifiers view
-- This view combines food_drink_items with their categories and prepares for future modifier support

CREATE OR REPLACE VIEW public.menu_items_with_working_modifiers AS
SELECT 
    fdi.id,
    fdi.name,
    fdi.description,
    fdi.price::text as price, -- Convert numeric to text as expected by TypeScript
    fdi.is_available,
    fdi.sort_order as display_order, -- Map sort_order to display_order
    fdi.category_id,
    fdi.image_url as image_id, -- Map image_url to image_id for now
    fdi.created_at,
    fdi.updated_at,
    fdi.image_url,
    -- Category as JSON object
    json_build_object(
        'id', fdc.id,
        'name', fdc.name,
        'type', CASE 
            WHEN fdc.name ILIKE '%drink%' OR fdc.name ILIKE '%beverage%' OR fdc.name ILIKE '%cocktail%' OR fdc.name ILIKE '%beer%' OR fdc.name ILIKE '%wine%' THEN 'drink'
            ELSE 'food'
        END
    ) as category,
    -- Empty modifiers for now (will be populated when modifier system is implemented)
    '[]'::json as modifiers
FROM public.food_drink_items fdi
LEFT JOIN public.food_drink_categories fdc ON fdi.category_id = fdc.id
WHERE fdi.is_available = true AND fdc.is_active = true;

-- Also need to fix the food_drink_categories table to include the missing columns that your code expects
-- Add missing columns to match your TypeScript interface
ALTER TABLE public.food_drink_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'food',
ADD COLUMN IF NOT EXISTS color TEXT;

-- Update the type column based on category names (you may need to adjust this logic)
UPDATE public.food_drink_categories 
SET type = CASE 
    WHEN name ILIKE '%drink%' OR name ILIKE '%beverage%' OR name ILIKE '%cocktail%' OR name ILIKE '%beer%' OR name ILIKE '%wine%' THEN 'drink'
    ELSE 'food'
END
WHERE type IS NULL OR type = 'food';

-- Copy sort_order to display_order if display_order is 0
UPDATE public.food_drink_categories 
SET display_order = COALESCE(sort_order, 0) 
WHERE display_order = 0;

-- Add missing columns to food_drink_items table
ALTER TABLE public.food_drink_items
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Copy sort_order to display_order if display_order is 0  
UPDATE public.food_drink_items
SET display_order = COALESCE(sort_order, 0)
WHERE display_order = 0;

-- Grant permissions on the view
GRANT SELECT ON public.menu_items_with_working_modifiers TO anon;
GRANT SELECT ON public.menu_items_with_working_modifiers TO authenticated;
GRANT SELECT ON public.menu_items_with_working_modifiers TO service_role;