import { supabase } from './supabase';
import type { Collect, TextCollectColor } from '../types/collect';
import type { Letter } from '../types/letter';

export async function getCollects(goalId: string): Promise<Collect[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('collects')
    .select('*')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCollect(id: string): Promise<Collect> {
  const { data, error } = await supabase
    .from('collects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCollect(data: {
  type: 'text' | 'image' | 'video' | 'link';
  content: string;
  caption?: string;
  title?: string;
  preview_image?: string;
  color?: TextCollectColor;
  goal_id: string;
}): Promise<Collect> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: collect, error } = await supabase
    .from('collects')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return collect;
}

export async function updateCollect(
  id: string,
  updates: Partial<{
    content: string;
    caption: string;
    title: string;
    preview_image: string;
    color: TextCollectColor;
  }>
): Promise<Collect> {
  // 直接更新指定的欄位，不需要先獲取現有資料
  const { data, error } = await supabase
    .from('collects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Update collect error:', error);
    throw new Error('更新收藏失敗，請稍後再試');
  }

  return data;
}

export async function deleteCollect(id: string): Promise<void> {
  const { error } = await supabase
    .from('collects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getLinkPreview(url: string) {
  try {
    const urlObj = new URL(url);
    
    // Handle YouTube links
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.hostname.includes('youtu.be') 
        ? urlObj.pathname.slice(1)
        : new URLSearchParams(urlObj.search).get('v');
        
      if (videoId) {
        return {
          title: 'YouTube Video',
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          url,
          type: 'youtube',
          videoId
        };
      }
    }
    
    // Handle Instagram links
    if (urlObj.hostname.includes('instagram.com')) {
      return {
        title: 'Instagram Post',
        image: null,
        url,
        type: 'instagram'
      };
    }

    // Use CORS proxy to get general link previews
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch URL');
    
    const data = await response.json();
    const html = data.contents;
    
    // Extract meta information from HTML
    const getMetaContent = (selectors: string[]) => {
      for (const selector of selectors) {
        const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${selector}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
                     html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${selector}["']`, 'i'));
        if (match?.[1]) return match[1];
      }
      return null;
    };

    const title = 
      getMetaContent(['og:title', 'twitter:title']) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
      urlObj.hostname;

    const image = getMetaContent([
      'og:image',
      'twitter:image',
      'twitter:image:src'
    ]);

    const description = getMetaContent([
      'og:description',
      'twitter:description',
      'description'
    ]);

    return {
      title: title?.trim() || urlObj.hostname,
      image: image || null,
      description: description?.trim(),
      url,
      type: 'link'
    };
  } catch (error) {
    console.error('Failed to get link preview:', error);
    return {
      title: url,
      image: null,
      description: null,
      url,
      type: 'link'
    };
  }
}

export async function getLetter(id: string): Promise<Letter> {
  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}