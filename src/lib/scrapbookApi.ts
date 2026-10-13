import { supabase, isSupabaseConfigured } from './supabase';
import { personalization as defaultPersonalization, type PersonalizationData } from '../data/personalization';

export interface ScrapbookRecord {
  id: string;
  content_json: PersonalizationData;
  updated_at: string;
  updated_by?: string;
}

/**
 * Fetch the published scrapbook content.
 * Available to everyone (anon & authenticated).
 * Protected by database Row Level Security (id = 'published' only).
 */
export async function getPublishedScrapbook(): Promise<{ data: PersonalizationData; updatedAt: string | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { data: defaultPersonalization, updatedAt: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('scrapbook_content')
      .select('content_json, updated_at')
      .eq('id', 'published')
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch published scrapbook from Supabase:', error.message);
      return { data: defaultPersonalization, updatedAt: null, error: new Error(error.message) };
    }

    if (data && data.content_json) {
      return {
        data: {
          ...defaultPersonalization,
          ...data.content_json,
          apology: { ...defaultPersonalization.apology, ...(data.content_json.apology || {}) },
          chatMemories: { ...defaultPersonalization.chatMemories, ...(data.content_json.chatMemories || {}) },
          promises: { ...defaultPersonalization.promises, ...(data.content_json.promises || {}) },
        },
        updatedAt: data.updated_at,
        error: null,
      };
    }

    return { data: defaultPersonalization, updatedAt: null, error: null };
  } catch (err: any) {
    console.warn('Unexpected error fetching published scrapbook:', err);
    return { data: defaultPersonalization, updatedAt: null, error: err };
  }
}

/**
 * Fetch the draft scrapbook content.
 * Available ONLY to verified owners. RLS will block unauthorized queries.
 */
export async function getDraftScrapbook(): Promise<{ data: PersonalizationData | null; updatedAt: string | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { data: defaultPersonalization, updatedAt: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('scrapbook_content')
      .select('content_json, updated_at')
      .eq('id', 'draft')
      .maybeSingle();

    if (error) {
      return { data: null, updatedAt: null, error: new Error(error.message) };
    }

    if (data && data.content_json) {
      return {
        data: {
          ...defaultPersonalization,
          ...data.content_json,
          apology: { ...defaultPersonalization.apology, ...(data.content_json.apology || {}) },
          chatMemories: { ...defaultPersonalization.chatMemories, ...(data.content_json.chatMemories || {}) },
          promises: { ...defaultPersonalization.promises, ...(data.content_json.promises || {}) },
        },
        updatedAt: data.updated_at,
        error: null,
      };
    }

    // If draft doesn't exist yet, try to load published as starting point
    const published = await getPublishedScrapbook();
    return { data: published.data, updatedAt: null, error: null };
  } catch (err: any) {
    return { data: null, updatedAt: null, error: err };
  }
}

/**
 * Save draft content to Supabase.
 * Enforced by RLS: Only authorized owner can write.
 */
export async function saveDraftScrapbook(content: PersonalizationData): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase is not configured') };
  }

  try {
    const { error } = await supabase
      .from('scrapbook_content')
      .upsert({
        id: 'draft',
        content_json: content,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Atomically publish the draft content to the published snapshot.
 * Calls PostgreSQL RPC `publish_scrapbook_draft()`.
 */
export async function publishDraftScrapbook(): Promise<{ data: PersonalizationData | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('publish_scrapbook_draft');

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Reset draft back to currently published content.
 */
export async function resetDraftToPublished(): Promise<{ data: PersonalizationData | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const publishedRes = await getPublishedScrapbook();
    if (publishedRes.error) {
      return { data: null, error: publishedRes.error };
    }

    const { error: saveError } = await saveDraftScrapbook(publishedRes.data);
    if (saveError) {
      return { data: null, error: saveError };
    }

    return { data: publishedRes.data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Check if the currently authenticated user is registered in scrapbook_owners.
 */
export async function checkIsOwner(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('scrapbook_owners')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Upload an image to Supabase Storage bucket 'scrapbook-media'.
 * Returns the permanent public URL and storage path.
 */
export async function uploadScrapbookImage(
  file: File,
  caption: string = '',
  dateTag: string = ''
): Promise<{ url: string; path: string; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { url: '', path: '', error: new Error('Supabase is not configured') };
  }

  try {
    // Generate clean unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('scrapbook-media')
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      return { url: '', path: '', error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from('scrapbook-media')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Record in scrapbook_media table for media management
    await supabase.from('scrapbook_media').insert({
      storage_path: filePath,
      public_url: publicUrl,
      caption: caption,
      date_tag: dateTag,
      alt_text: caption || 'Scrapbook chat memory',
      is_published: false,
    });

    return { url: publicUrl, path: filePath, error: null };
  } catch (err: any) {
    return { url: '', path: '', error: err };
  }
}

/**
 * Delete an image from Supabase Storage and media table.
 */
export async function deleteScrapbookImage(storagePath: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase is not configured') };
  }

  try {
    const { error: storageError } = await supabase.storage
      .from('scrapbook-media')
      .remove([storagePath]);

    if (storageError) {
      console.warn('Storage deletion error:', storageError.message);
    }

    await supabase
      .from('scrapbook_media')
      .delete()
      .eq('storage_path', storagePath);

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}
