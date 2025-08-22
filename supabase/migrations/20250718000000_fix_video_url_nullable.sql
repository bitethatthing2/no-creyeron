-- Make video_url nullable to support image content_posts
ALTER TABLE "public"."content_posts" ALTER COLUMN "video_url" DROP NOT NULL;