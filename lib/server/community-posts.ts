import 'server-only';

import sanitizeHtml from 'sanitize-html';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export const COMMUNITY_PAGE_SIZE = 4;

interface CommunityPostRow {
  id: string;
  slug: string;
  author_id: string | null;
  title: string;
  topic: string | null;
  content: string;
  content_format?: 'PLAIN_TEXT' | 'RICH_HTML';
  main_image_url: string | null;
  likes_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  created_at: string;
}

interface CommunityAuthorRow {
  id: string;
  nickname: string | null;
  profile_img: string | null;
}

export interface CommunityFeedPost {
  id: string;
  slug: string;
  title: string;
  topic: string | null;
  excerpt: string;
  imageUrl: string | null;
  authorName: string | null;
  authorImageUrl: string | null;
  likesCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
}

export interface CommunityFeedPage {
  posts: CommunityFeedPost[];
  nextCursor: string | null;
}

export interface CommunityPostDetail extends CommunityFeedPost {
  authorId: string | null;
  content: string;
  contentFormat: 'PLAIN_TEXT' | 'RICH_HTML';
  safeHtml: string | null;
  imageUrls: string[];
}

function sanitizePostHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'figure', 'figcaption', 'img', 'a'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['https'],
    allowedSchemesByTag: { img: ['https'], a: ['https', 'mailto'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
      img: sanitizeHtml.simpleTransform('img', { loading: 'lazy', decoding: 'async' }),
    },
  });
}

function addBlurredImageFrames(value: string): string {
  return value.replace(/<img\b[^>]*>/gi, (image) => {
    const background = image.replace('<img', '<img aria-hidden="true" class="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"');
    const foreground = image.replace('<img', '<img class="absolute inset-0 z-10 h-full w-full object-contain"');
    return `<span class="relative -ml-5 my-4 block aspect-[16/10] w-[calc(100%+40px)] overflow-hidden bg-[#f5f2ef] sm:-ml-7 sm:w-[calc(100%+56px)]">${background}<span aria-hidden="true" class="absolute inset-0 bg-black/15"></span>${foreground}</span>`;
  });
}

function plainText(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

export async function getCommunityFeedPage(cursor?: string | null): Promise<CommunityFeedPage> {
  const supabase = await createSupabaseAdminClient();
  let query = supabase
    .from('posts')
    .select('id, slug, author_id, title, topic, content, content_format, main_image_url, likes_count, comment_count, share_count, created_at')
    .order('created_at', { ascending: false })
    .limit(COMMUNITY_PAGE_SIZE + 1);

  if (cursor) query = query.lt('created_at', cursor);

  let { data, error } = await query;
  if (error?.code === '42703' && error.message.includes('topic')) {
    let legacyQuery = supabase
      .from('posts')
      .select('id, slug, author_id, title, content, content_format, main_image_url, likes_count, comment_count, share_count, created_at')
      .order('created_at', { ascending: false })
      .limit(COMMUNITY_PAGE_SIZE + 1);
    if (cursor) legacyQuery = legacyQuery.lt('created_at', cursor);
    const legacyResult = await legacyQuery;
    data = legacyResult.data?.map((row) => ({ ...row, topic: null })) ?? null;
    error = legacyResult.error;
  }
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CommunityPostRow[];
  const pageRows = rows.slice(0, COMMUNITY_PAGE_SIZE);
  const authorIds = [...new Set(pageRows.map((row) => row.author_id).filter((id): id is string => Boolean(id)))];
  const authors = new Map<string, CommunityAuthorRow>();

  if (authorIds.length > 0) {
    const { data: authorData, error: authorError } = await supabase
      .from('users')
      .select('id, nickname, profile_img')
      .in('id', authorIds);
    if (authorError) throw new Error(authorError.message);
    for (const author of (authorData ?? []) as CommunityAuthorRow[]) authors.set(author.id, author);
  }

  return {
    posts: pageRows.map((row) => {
      const author = row.author_id ? authors.get(row.author_id) : undefined;
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        topic: row.topic,
        excerpt: plainText(row.content),
        imageUrl: row.main_image_url,
        authorName: author?.nickname ?? null,
        authorImageUrl: author?.profile_img ?? null,
        likesCount: row.likes_count ?? 0,
        commentCount: row.comment_count ?? 0,
        shareCount: row.share_count ?? 0,
        createdAt: row.created_at,
      };
    }),
    nextCursor: rows.length > COMMUNITY_PAGE_SIZE ? pageRows.at(-1)?.created_at ?? null : null,
  };
}

export async function getCommunityPostBySlug(slug: string): Promise<CommunityPostDetail | null> {
  const supabase = await createSupabaseAdminClient();
  let lookup = slug;
  try { lookup = decodeURIComponent(slug); } catch { /* 이미 해석된 경로를 그대로 사용한다. */ }
  let { data, error } = await supabase
    .from('posts')
    .select('id, slug, author_id, title, topic, content, content_format, main_image_url, likes_count, comment_count, share_count, created_at')
    .eq('slug', lookup)
    .maybeSingle();
  if (error?.code === '42703' && error.message.includes('topic')) {
    const legacyResult = await supabase
      .from('posts')
      .select('id, slug, author_id, title, content, content_format, main_image_url, likes_count, comment_count, share_count, created_at')
      .eq('slug', lookup)
      .maybeSingle();
    data = legacyResult.data ? { ...legacyResult.data, topic: null } : null;
    error = legacyResult.error;
  }
  if (!error && !data && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookup)) {
    const legacyIdResult = await supabase
      .from('posts')
      .select('id, slug, author_id, title, topic, content, content_format, main_image_url, likes_count, comment_count, share_count, created_at')
      .eq('id', lookup)
      .maybeSingle();
    data = legacyIdResult.data;
    error = legacyIdResult.error;
  }
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as CommunityPostRow;
  const contentFormat = row.content_format === 'RICH_HTML' ? 'RICH_HTML' : 'PLAIN_TEXT';

  const [{ data: authorData }, { data: imageData }] = await Promise.all([
    row.author_id
      ? supabase.from('users').select('id, nickname, profile_img').eq('id', row.author_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('post_images').select('image_url, sort_order').eq('post_id', row.id).order('sort_order'),
  ]);
  const author = authorData as CommunityAuthorRow | null;
  const imageUrls = ((imageData ?? []) as Array<{ image_url: string }>).map((image) => image.image_url);
  if (!imageUrls.length && row.main_image_url) imageUrls.push(row.main_image_url);

  return {
    id: row.id,
    slug: row.slug,
    authorId: row.author_id,
    title: row.title,
    topic: row.topic,
    content: row.content,
    contentFormat,
    safeHtml: contentFormat === 'RICH_HTML' ? addBlurredImageFrames(sanitizePostHtml(row.content)) : null,
    excerpt: plainText(row.content),
    imageUrl: row.main_image_url,
    imageUrls,
    authorName: author?.nickname ?? null,
    authorImageUrl: author?.profile_img ?? null,
    likesCount: row.likes_count ?? 0,
    commentCount: row.comment_count ?? 0,
    shareCount: row.share_count ?? 0,
    createdAt: row.created_at,
  };
}
