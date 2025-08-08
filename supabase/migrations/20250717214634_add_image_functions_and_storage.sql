-- Create images table
CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "url" text NOT NULL,
    "size" integer NOT NULL,
    "mime_type" text NOT NULL,
    "image_type" text NOT NULL DEFAULT 'menu_item',
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_images_user_id" ON "public"."images" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_images_created_at" ON "public"."images" USING btree ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_images_type" ON "public"."images" USING btree ("image_type");

-- Add primary key
ALTER TABLE "public"."images" ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint
ALTER TABLE "public"."images" ADD CONSTRAINT "images_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Create RLS policies
CREATE POLICY "Everyone can view images"
    ON "public"."images"
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Users can insert their own images"
    ON "public"."images"
    FOR INSERT
    TO public
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own images"
    ON "public"."images"
    FOR UPDATE
    TO public
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."images" TO "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."images" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."images" TO "service_role";

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/webm', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle image uploads
CREATE OR REPLACE FUNCTION handle_image_upload(
    p_user_id uuid,
    p_file_name text,
    p_file_size integer,
    p_mime_type text,
    p_image_type text DEFAULT 'menu_item'
) RETURNS uuid AS $$
DECLARE
    v_image_id uuid;
    v_user_folder text;
    v_file_path text;
    v_public_url text;
BEGIN
    -- Generate unique image ID
    v_image_id := gen_random_uuid();
    
    -- Create user folder (first 8 chars of user ID)
    v_user_folder := substring(p_user_id::text, 1, 8);
    
    -- Generate file path
    v_file_path := p_image_type || '/' || v_user_folder || '/' || v_image_id || '_' || p_file_name;
    
    -- Generate public URL
    v_public_url := 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/images/' || v_file_path;
    
    -- Insert image record
    INSERT INTO images (id, user_id, name, url, size, mime_type, image_type)
    VALUES (v_image_id, p_user_id, p_file_name, v_public_url, p_file_size, p_mime_type, p_image_type);
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create image record
CREATE OR REPLACE FUNCTION create_image_record(
    p_name text,
    p_url text,
    p_size integer,
    p_type text DEFAULT 'profile'
) RETURNS uuid AS $$
DECLARE
    v_image_id uuid;
    v_user_id uuid;
BEGIN
    -- Get current user ID
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Generate unique image ID
    v_image_id := gen_random_uuid();
    
    -- Insert image record
    INSERT INTO images (id, user_id, name, url, size, mime_type, image_type)
    VALUES (v_image_id, v_user_id, p_name, p_url, p_size, 'image/jpeg', p_type);
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update menu item image
CREATE OR REPLACE FUNCTION admin_update_item_image(
    p_item_id uuid,
    p_image_url text
) RETURNS void AS $$
BEGIN
    -- Update food_drink_items table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'food_drink_items') THEN
        UPDATE food_drink_items 
        SET image_url = p_image_url
        WHERE id = p_item_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_pic_url') THEN
        ALTER TABLE users ADD COLUMN profile_pic_url text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'custom_avatar_id') THEN
        ALTER TABLE users ADD COLUMN custom_avatar_id uuid;
    END IF;
END $$;

-- Add image_id column to food_drink_items if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'food_drink_items') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_drink_items' AND column_name = 'image_id') THEN
            ALTER TABLE food_drink_items ADD COLUMN image_id uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_drink_items' AND column_name = 'image_url') THEN
            ALTER TABLE food_drink_items ADD COLUMN image_url text;
        END IF;
    END IF;
END $$;