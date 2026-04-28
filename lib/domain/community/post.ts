import { createSupabaseAdminClient, getPublicUsersByIds } from '@/lib/server/supabase-admin';
import type {
  PostBoardCategory,
  PostCategoryStored,
  PostData,
  SerializableTimestamp,
} from '@/packages/type/postType';

type PostRow = {
  id: string;
  author_id: string | null;
  title: string;
  content: string | null;
  likes_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  main_image_url: string | null;
  category?: string | null;
  tags?: string[] | null;
  view_count?: number | null;
};

const authorInfoCache = new Map<
  string,
  { nickname: string; photoURL: string | null; cachedAt: number }
>();

const CACHE_TTL = 5 * 60 * 1000;

function toSerializableTimestamp(value: unknown): SerializableTimestamp | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return null;
    return {
      seconds: Math.floor(time / 1000),
      nanoseconds: (time % 1000) * 1_000_000,
    };
  }

  if (
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    const timestamp = value as { seconds: number; nanoseconds?: unknown };
    return {
      seconds: timestamp.seconds,
      nanoseconds:
        typeof timestamp.nanoseconds === 'number'
          ? timestamp.nanoseconds
          : 0,
    };
  }

  return null;
}

export function timestampToMillis(value: unknown): number {
  const timestamp = toSerializableTimestamp(value);
  if (!timestamp) return 0;
  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1_000_000);
}

function normalizePostCategory(raw: string | null | undefined): PostCategoryStored | undefined {
  if (raw === 'daily' || raw === 'question' || raw === 'adoption' || raw === 'pet-life') {
    return raw;
  }
  return undefined;
}

export function mapSupabasePostRow(row: PostRow): PostData {
  return {
    id: row.id,
    title: row.title ?? '',
    content: row.content ?? '',
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    authorId: row.author_id ?? '',
    authorName: '',
    authorPhotoURL: null,
    createdAt: toSerializableTimestamp(row.created_at),
    updatedAt: toSerializableTimestamp(row.updated_at),
    thumbnail: row.main_image_url ?? null,
    likes: row.likes_count ?? 0,
    category: normalizePostCategory(row.category),
    viewCount: row.view_count ?? 0,
  };
}

function sortPostsByCreatedAtDesc(posts: PostData[]): PostData[] {
  return [...posts].sort(
    (a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
  );
}

async function getUserAuthorInfo(
  authorId: string,
): Promise<{ nickname: string; photoURL: string | null }> {
  const userMap = await getPublicUsersByIds([authorId]);
  const userData = userMap.get(authorId);

  if (!userData) {
    return { nickname: '', photoURL: null };
  }

  return {
    nickname: userData.nickname || '',
    photoURL: userData.profile_img || null,
  };
}

export async function enrichPostsWithAuthorInfo(
  posts: PostData[],
): Promise<PostData[]> {
  if (posts.length === 0) {
    return posts;
  }

  const uniqueAuthorIds = [
    ...new Set(
      posts.filter((post) => post.authorId).map((post) => post.authorId),
    ),
  ];

  if (uniqueAuthorIds.length === 0) {
    return posts;
  }

  const authorInfoMap = new Map<
    string,
    { nickname: string; photoURL: string | null }
  >();
  const now = Date.now();
  const authorIdsToFetch: string[] = [];

  uniqueAuthorIds.forEach((authorId) => {
    const cached = authorInfoCache.get(authorId);
    if (cached && now - cached.cachedAt < CACHE_TTL) {
      authorInfoMap.set(authorId, {
        nickname: cached.nickname,
        photoURL: cached.photoURL,
      });
    } else {
      authorIdsToFetch.push(authorId);
    }
  });

  if (authorIdsToFetch.length > 0) {
    await Promise.all(
      authorIdsToFetch.map(async (authorId) => {
        try {
          const authorInfo = await getUserAuthorInfo(authorId);
          authorInfoCache.set(authorId, {
            ...authorInfo,
            cachedAt: now,
          });
          authorInfoMap.set(authorId, authorInfo);
        } catch (error) {
          console.error(`작성자 ${authorId} 정보 가져오기 실패:`, error);
          const fallback = { nickname: '', photoURL: null };
          authorInfoCache.set(authorId, {
            ...fallback,
            cachedAt: now,
          });
          authorInfoMap.set(authorId, fallback);
        }
      }),
    );
  }

  return posts.map((post) => {
    if (!post.authorId) return post;

    const authorInfo = authorInfoMap.get(post.authorId);
    if (!authorInfo) return post;

    return {
      ...post,
      authorName: authorInfo.nickname || post.authorName || '',
      authorPhotoURL: authorInfo.photoURL ?? post.authorPhotoURL ?? null,
    };
  });
}

function basePostSelect() {
  return 'id, author_id, title, content, likes_count, created_at, updated_at, main_image_url, category, tags, view_count';
}

function asPostRows(data: unknown): PostRow[] {
  return Array.isArray(data) ? (data as PostRow[]) : [];
}

function asPostRow(data: unknown): PostRow | null {
  return data ? (data as PostRow) : null;
}

export async function getAllBoardsData(
  limitCount: number = 60,
): Promise<PostData[]> {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select(basePostSelect())
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    throw new Error(error.message);
  }

  return enrichPostsWithAuthorInfo(asPostRows(data).map(mapSupabasePostRow));
}

export async function getBoardsData(): Promise<PostData[]> {
  return getAllBoardsData(1000);
}

export async function getRecentBoardsData(
  limitCount: number = 20,
): Promise<PostData[]> {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select(basePostSelect())
    .eq('category', 'adoption')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    throw new Error(error.message);
  }

  return enrichPostsWithAuthorInfo(asPostRows(data).map(mapSupabasePostRow));
}

export async function getTrendingBoardsData(
  limitCount: number = 20,
): Promise<PostData[]> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select(basePostSelect())
      .or('category.eq.daily,category.eq.pet-life,category.is.null')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      throw new Error(error.message);
    }

    return enrichPostsWithAuthorInfo(asPostRows(data).map(mapSupabasePostRow));
  } catch (error) {
    console.error('트렌딩 게시물 조회 중 오류 발생:', error);
    return [];
  }
}

export async function getBoardsDataBySearch(
  searchQuery: string,
): Promise<PostData[]> {
  if (!searchQuery?.trim()) {
    return [];
  }

  const trimmedQuery = searchQuery.trim();
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const [titleResult, tagResult] = await Promise.all([
      supabaseAdmin
        .from('posts')
        .select(basePostSelect())
        .ilike('title', `%${trimmedQuery}%`)
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('posts')
        .select(basePostSelect())
        .contains('tags', [trimmedQuery])
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (titleResult.error) throw new Error(titleResult.error.message);
    if (tagResult.error) throw new Error(tagResult.error.message);

    const boardsMap = new Map<string, PostData>();
    [...asPostRows(titleResult.data), ...asPostRows(tagResult.data)].forEach((row) => {
      boardsMap.set(row.id, mapSupabasePostRow(row));
    });

    return await enrichPostsWithAuthorInfo(
      sortPostsByCreatedAtDesc(Array.from(boardsMap.values())),
    );
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    return [];
  }
}

export async function getPostById(postId: string): Promise<PostData | null> {
  if (!postId) {
    return null;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select(basePostSelect())
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const postRow = asPostRow(data);
    if (!postRow) return null;

    const enrichedPosts = await enrichPostsWithAuthorInfo([
      mapSupabasePostRow(postRow),
    ]);
    return enrichedPosts[0] || null;
  } catch (error) {
    console.error('게시물 조회 중 오류 발생:', error);
    return null;
  }
}

export async function getPostsByAuthorId(
  authorId: string,
  limitCount: number = 100,
): Promise<PostData[]> {
  if (!authorId) return [];

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select(basePostSelect())
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    throw new Error(error.message);
  }

  return enrichPostsWithAuthorInfo(asPostRows(data).map(mapSupabasePostRow));
}

export async function getPostTitlesByIds(
  postIds: string[],
): Promise<Map<string, string>> {
  const uniquePostIds = [...new Set(postIds.filter(Boolean))];
  if (uniquePostIds.length === 0) return new Map();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, title')
    .in('id', uniquePostIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.id, row.title ?? '']));
}

export async function getPostsCountByAuthorId(authorId: string): Promise<number> {
  if (!authorId) return 0;

  const supabaseAdmin = createSupabaseAdminClient();
  const { count, error } = await supabaseAdmin
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', authorId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export function normalizeBoardCategory(
  raw: PostCategoryStored | undefined,
): PostBoardCategory {
  if (raw === 'adoption' || raw === 'question' || raw === 'daily') return raw;
  return 'daily';
}
