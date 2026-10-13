-- ==============================================================================
-- A LITTLE PLACE FOR US — COMPLETE SUPABASE DATABASE SETUP
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste and Run.
-- ==============================================================================

-- 1. Create scrapbook_owners table
CREATE TABLE IF NOT EXISTS public.scrapbook_owners (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.scrapbook_owners ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an authorized owner
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrapbook_owners' AND policyname = 'Users can check their own owner record'
  ) THEN
    CREATE POLICY "Users can check their own owner record"
      ON public.scrapbook_owners
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 2. Create scrapbook_content table (draft & published separation)
CREATE TABLE IF NOT EXISTS public.scrapbook_content (
  id TEXT PRIMARY KEY, -- 'published' or 'draft'
  content_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.scrapbook_content ENABLE ROW LEVEL SECURITY;

-- RLS: Public / anon can ONLY read the 'published' row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrapbook_content' AND policyname = 'Public can only read published scrapbook content'
  ) THEN
    CREATE POLICY "Public can only read published scrapbook content"
      ON public.scrapbook_content
      FOR SELECT
      USING (id = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrapbook_content' AND policyname = 'Owners can read draft and published content'
  ) THEN
    CREATE POLICY "Owners can read draft and published content"
      ON public.scrapbook_content
      FOR SELECT
      TO authenticated
      USING (public.is_scrapbook_owner());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrapbook_content' AND policyname = 'Owners can update scrapbook content'
  ) THEN
    CREATE POLICY "Owners can update scrapbook content"
      ON public.scrapbook_content
      FOR ALL
      TO authenticated
      USING (public.is_scrapbook_owner())
      WITH CHECK (public.is_scrapbook_owner());
  END IF;
END $$;

-- 3. Create scrapbook_media table
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrapbook_media' AND policyname = 'Public can view published media'
  ) THEN
    CREATE POLICY "Public can view published media"
      ON public.scrapbook_media
      FOR SELECT
      USING (is_published = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scrapbook_media' AND policyname = 'Owners can manage scrapbook media'
  ) THEN
    CREATE POLICY "Owners can manage scrapbook media"
      ON public.scrapbook_media
      FOR ALL
      TO authenticated
      USING (public.is_scrapbook_owner())
      WITH CHECK (public.is_scrapbook_owner());
  END IF;
END $$;

-- 4. Atomic Publish RPC function
CREATE OR REPLACE FUNCTION public.publish_scrapbook_draft()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_record RECORD;
BEGIN
  IF NOT public.is_scrapbook_owner() THEN
    RAISE EXCEPTION 'Unauthorized: only verified scrapbook owners can publish content';
  END IF;

  SELECT * INTO draft_record FROM public.scrapbook_content WHERE id = 'draft';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No draft found to publish';
  END IF;

  INSERT INTO public.scrapbook_content (id, content_json, updated_at, updated_by)
  VALUES ('published', draft_record.content_json, timezone('utc'::text, now()), auth.uid())
  ON CONFLICT (id) DO UPDATE
  SET content_json = EXCLUDED.content_json,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by;

  UPDATE public.scrapbook_media
  SET is_published = true
  WHERE created_by = auth.uid() OR created_by IS NULL;

  RETURN draft_record.content_json;
END;
$$;

-- 5. Storage Bucket & Policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scrapbook-media',
  'scrapbook-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public read access for scrapbook media'
  ) THEN
    CREATE POLICY "Public read access for scrapbook media"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'scrapbook-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Owner upload access for scrapbook media'
  ) THEN
    CREATE POLICY "Owner upload access for scrapbook media"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'scrapbook-media'
        AND public.is_scrapbook_owner()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Owner update access for scrapbook media'
  ) THEN
    CREATE POLICY "Owner update access for scrapbook media"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'scrapbook-media'
        AND public.is_scrapbook_owner()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Owner delete access for scrapbook media'
  ) THEN
    CREATE POLICY "Owner delete access for scrapbook media"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'scrapbook-media'
        AND public.is_scrapbook_owner()
      );
  END IF;
END $$;

-- 6. Initial Seed Content
INSERT INTO public.scrapbook_content (id, content_json, updated_at)
VALUES (
  'published',
  '{
    "recipientName": "My Love",
    "apology": {
      "topTag": "A little something from my heart 💜",
      "heading": "I''m Sorry, My Love",
      "subtitle": "Please read this when you''re ready.",
      "letterParagraphs": [
        "My love,",
        "I have something important to tell you, from the bottom of my heart.",
        "I''m truly sorry for the times I hurt you. You mean so much to me, and I never want to treat your feelings as something small.",
        "I know that saying sorry cannot instantly fix everything. I want to understand you better, listen to you, and show through my actions that your happiness and trust matter to me.",
        "You are so special to me. I don''t want to give up on us. I want to learn, grow, and become a better partner.",
        "I''m sorry, my love. 💜"
      ],
      "handwrittenNote": "Made with all my heart, just for you.",
      "scrollCue": "Scroll a little, there''s more for you ↓"
    },
    "chatMemories": {
      "heading": "Little Pieces of Us",
      "subtitle": "Every message holds a little memory.",
      "chats": [
        {
          "id": "chat-01",
          "src": "/images/chats/chat-01.jpg",
          "caption": "A little moment I still smile about.",
          "date": "Special Memory",
          "alt": "Chat screenshot 1"
        },
        {
          "id": "chat-02",
          "src": "/images/chats/chat-02.jpg",
          "caption": "One of my favourite conversations.",
          "date": "Sweet Exchange",
          "alt": "Chat screenshot 2"
        },
        {
          "id": "chat-03",
          "src": "/images/chats/chat-03.jpg",
          "caption": "A memory I want to keep close.",
          "date": "Comfort & Warmth",
          "alt": "Chat screenshot 3"
        },
        {
          "id": "chat-04",
          "src": "/images/chats/chat-04.jpg",
          "caption": "Little things that mean a lot to me.",
          "date": "Cherished Words",
          "alt": "Chat screenshot 4"
        },
        {
          "id": "chat-05",
          "src": "/images/chats/chat-05.jpg",
          "caption": "When talking to you made everything better.",
          "date": "A Gentle Moment",
          "alt": "Chat screenshot 5"
        }
      ]
    },
    "promises": {
      "heading": "My Promises to You 💜",
      "subtitle": "Not just words. Little things I want to keep working on.",
      "items": [
        {
          "id": 1,
          "text": "I promise to listen to your feelings and never dismiss what matters to you.",
          "iconName": "ear"
        },
        {
          "id": 2,
          "text": "I promise to communicate honestly, even when a conversation is difficult.",
          "iconName": "message"
        },
        {
          "id": 3,
          "text": "I promise to respect you, your boundaries, and your need for time and space.",
          "iconName": "shield"
        },
        {
          "id": 4,
          "text": "I promise to keep learning from my mistakes instead of repeating them without trying to change.",
          "iconName": "sparkles"
        },
        {
          "id": 5,
          "text": "I promise to show you love through my actions, my patience, and the little things I do.",
          "iconName": "heart"
        },
        {
          "id": 6,
          "text": "I promise to keep choosing kindness, understanding, and effort as we grow together.",
          "iconName": "smile"
        }
      ],
      "closingParagraphs": [
        "I don''t want to lose you, my love.",
        "I want to keep making memories with you, sharing little moments, laughing together, and learning how to love each other better.",
        "I can''t promise to be perfect, but I want to keep trying to be better for myself and for us.",
        "You mean so much to me. I hope my actions can slowly show you everything my heart is trying to say."
      ],
      "signature": "Always with love, 💜"
    }
  }'::jsonb,
  timezone('utc'::text, now())
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.scrapbook_content (id, content_json, updated_at)
SELECT 'draft', content_json, timezone('utc'::text, now())
FROM public.scrapbook_content
WHERE id = 'published'
ON CONFLICT (id) DO NOTHING;
