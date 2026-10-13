-- ==============================================================================
-- Migration: 002_create_storage_bucket.sql
-- Description: Create 'scrapbook-media' bucket and storage RLS policies
-- ==============================================================================

-- 1. Create the storage bucket if not already existing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scrapbook-media',
  'scrapbook-media',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

-- 2. Storage Policies

-- Anyone (public or authenticated) can view/download images in scrapbook-media
CREATE POLICY "Public read access for scrapbook media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'scrapbook-media');

-- Only verified scrapbook owners can upload images
CREATE POLICY "Owner upload access for scrapbook media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'scrapbook-media'
    AND public.is_scrapbook_owner()
  );

-- Only verified scrapbook owners can update images
CREATE POLICY "Owner update access for scrapbook media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'scrapbook-media'
    AND public.is_scrapbook_owner()
  );

-- Only verified scrapbook owners can delete images
CREATE POLICY "Owner delete access for scrapbook media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'scrapbook-media'
    AND public.is_scrapbook_owner()
  );
