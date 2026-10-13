-- ==============================================================================
-- Migration: 001_create_scrapbook_tables.sql
-- Description: Core tables, RLS policies, helper functions, and atomic publish RPC
-- ==============================================================================

-- 1. Create scrapbook_owners table
CREATE TABLE IF NOT EXISTS public.scrapbook_owners (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.scrapbook_owners ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if the current user is an authorized owner
CREATE OR REPLACE FUNCTION public.is_scrapbook_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scrapbook_owners
    WHERE user_id = auth.uid()
  );
$$;

-- Allow authenticated users to check their own owner status
CREATE POLICY "Users can check their own owner record"
  ON public.scrapbook_owners
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Create scrapbook_content table (draft & published separation)
CREATE TABLE IF NOT EXISTS public.scrapbook_content (
  id TEXT PRIMARY KEY, -- 'published' or 'draft'
  content_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.scrapbook_content ENABLE ROW LEVEL SECURITY;

-- RLS: Public / anon can ONLY read the 'published' row
CREATE POLICY "Public can only read published scrapbook content"
  ON public.scrapbook_content
  FOR SELECT
  USING (id = 'published');

-- RLS: Only verified owners can read any row (including drafts)
CREATE POLICY "Owners can read draft and published content"
  ON public.scrapbook_content
  FOR SELECT
  TO authenticated
  USING (public.is_scrapbook_owner());

-- RLS: Only verified owners can insert/update scrapbook content
CREATE POLICY "Owners can update scrapbook content"
  ON public.scrapbook_content
  FOR ALL
  TO authenticated
  USING (public.is_scrapbook_owner())
  WITH CHECK (public.is_scrapbook_owner());

-- 4. Create scrapbook_media table
CREATE TABLE IF NOT EXISTS public.scrapbook_media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  date_tag TEXT DEFAULT '',
  alt_text TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.scrapbook_media ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view only published media records
CREATE POLICY "Public can view published media"
  ON public.scrapbook_media
  FOR SELECT
  USING (is_published = true);

-- RLS: Only owners can read, insert, update, or delete media
CREATE POLICY "Owners can manage scrapbook media"
  ON public.scrapbook_media
  FOR ALL
  TO authenticated
  USING (public.is_scrapbook_owner())
  WITH CHECK (public.is_scrapbook_owner());

-- 5. Atomic Publish RPC function
CREATE OR REPLACE FUNCTION public.publish_scrapbook_draft()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_record RECORD;
BEGIN
  -- Validate authorization
  IF NOT public.is_scrapbook_owner() THEN
    RAISE EXCEPTION 'Unauthorized: only verified scrapbook owners can publish content';
  END IF;

  -- Validate draft existence
  SELECT * INTO draft_record FROM public.scrapbook_content WHERE id = 'draft';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No draft found to publish';
  END IF;

  -- Atomic copy from draft to published snapshot
  INSERT INTO public.scrapbook_content (id, content_json, updated_at, updated_by)
  VALUES ('published', draft_record.content_json, timezone('utc'::text, now()), auth.uid())
  ON CONFLICT (id) DO UPDATE
  SET content_json = EXCLUDED.content_json,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by;

  -- Mark media items created by owner as published
  UPDATE public.scrapbook_media
  SET is_published = true
  WHERE created_by = auth.uid() OR created_by IS NULL;

  RETURN draft_record.content_json;
END;
$$;
