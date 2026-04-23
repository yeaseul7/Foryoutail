import {
  getFirestoreDocument,
  listFirestoreCollection,
  runFirestoreCollectionQuery,
  type FirestoreRestRow,
} from '@/lib/server/firestore-rest';
import type { PostData } from '@/packages/type/postType';

type SerializableTimestamp = {
  seconds: number;
  nanoseconds: number;
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

function timestampToMillis(value: unknown): number {
  const timestamp = toSerializableTimestamp(value);
  if (!timestamp) return 0;
  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1_000_000);
}

function normalizePostRow(row: FirestoreRestRow): PostData {
  const data = row.data;
  return {
    id: row.id,
    title: typeof data.title === 'string' ? data.title : '',
    content: typeof data.content === 'string' ? data.content : '',
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    authorId: typeof data.authorId === 'string' ? data.authorId : '',
    authorName: typeof data.authorName === 'string' ? data.authorName : '',
    authorPhotoURL: typeof data.authorPhotoURL === 'string' ? data.authorPhotoURL : null,
    createdAt: toSerializableTimestamp(data.createdAt) as PostData['createdAt'],
    updatedAt: toSerializableTimestamp(data.updatedAt) as PostData['updatedAt'],
    thumbnail: typeof data.thumbnail === 'string' ? data.thumbnail : null,
    likes: typeof data.likes === 'number' ? data.likes : 0,
    category:
      typeof data.category === 'string'
        ? (data.category as PostData['category'])
        : undefined,
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
  const userDoc = await getFirestoreDocument('users', authorId);
  const userData = userDoc?.data;

  if (!userData) {
    console.warn(`작성자 ${authorId}의 users 문서가 존재하지 않습니다.`);
    return { nickname: '', photoURL: null };
  }

  return {
    nickname:
      (typeof userData.nickname === 'string' && userData.nickname) ||
      (typeof userData.displayName === 'string' && userData.displayName) ||
      '',
    photoURL: typeof userData.photoURL === 'string' ? userData.photoURL : null,
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
          const defaultInfo = {
            nickname: '',
            photoURL: null,
          };
          authorInfoCache.set(authorId, {
            ...defaultInfo,
            cachedAt: now,
          });
          authorInfoMap.set(authorId, defaultInfo);
        }
      }),
    );
  }

  return posts.map((post) => {
    if (!post.authorId) {
      return post;
    }

    const authorInfo = authorInfoMap.get(post.authorId);
    if (authorInfo) {
      return {
        ...post,
        authorName: authorInfo.nickname || post.authorName || '',
        authorPhotoURL: authorInfo.photoURL ?? post.authorPhotoURL ?? null,
      };
    }

    return post;
  });
}

export async function getAllBoardsData(
  limitCount: number = 60,
): Promise<PostData[]> {
  const rows = await runFirestoreCollectionQuery({
    collectionId: 'boards',
    limit: limitCount,
    orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
  });
  return await enrichPostsWithAuthorInfo(rows.map(normalizePostRow));
}

export async function getBoardsData(): Promise<PostData[]> {
  const rows = await listFirestoreCollection('boards');
  return await enrichPostsWithAuthorInfo(sortPostsByCreatedAtDesc(rows.map(normalizePostRow)));
}

export async function getRecentBoardsData(
  limitCount: number = 20,
): Promise<PostData[]> {
  const rows = await runFirestoreCollectionQuery({
    collectionId: 'boards',
    filters: [{ field: 'category', op: 'EQUAL', value: 'adoption' }],
    limit: limitCount,
  });
  return await enrichPostsWithAuthorInfo(
    sortPostsByCreatedAtDesc(rows.map(normalizePostRow)).slice(0, limitCount),
  );
}

export async function getTrendingBoardsData(
  limitCount: number = 20,
): Promise<PostData[]> {
  try {
    const [dailyLikeRows, allRows] = await Promise.all([
      runFirestoreCollectionQuery({
        collectionId: 'boards',
        filters: [{ field: 'category', op: 'IN', value: ['daily', 'pet-life'] }],
        limit: limitCount * 2,
      }),
      runFirestoreCollectionQuery({
        collectionId: 'boards',
        limit: limitCount * 3,
        orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
      }),
    ]);

    const dailyLikePosts = dailyLikeRows.map(normalizePostRow);
    const allPosts = allRows.map(normalizePostRow);
    const noCategoryPosts = allPosts.filter((post) => !post.category);

    const uniquePostsMap = new Map<string, PostData>();
    [...dailyLikePosts, ...noCategoryPosts].forEach((post) => {
      if (!uniquePostsMap.has(post.id)) {
        uniquePostsMap.set(post.id, post);
      }
    });

    const sortedPosts = sortPostsByCreatedAtDesc(Array.from(uniquePostsMap.values())).slice(
      0,
      limitCount,
    );

    return await enrichPostsWithAuthorInfo(sortedPosts);
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
  const endQuery = trimmedQuery + '\uf8ff';

  try {
    const [titleRows, tagRows] = await Promise.all([
      runFirestoreCollectionQuery({
        collectionId: 'boards',
        filters: [
          { field: 'title', op: 'GREATER_THAN_OR_EQUAL', value: trimmedQuery },
          { field: 'title', op: 'LESS_THAN_OR_EQUAL', value: endQuery },
        ],
      }),
      runFirestoreCollectionQuery({
        collectionId: 'boards',
        filters: [{ field: 'tags', op: 'ARRAY_CONTAINS', value: trimmedQuery }],
      }),
    ]);

    const boardsMap = new Map<string, PostData>();
    [...titleRows, ...tagRows].forEach((row) => {
      boardsMap.set(row.id, normalizePostRow(row));
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
    const row = await getFirestoreDocument('boards', postId);
    if (!row) return null;

    const postData = normalizePostRow(row);
    const enrichedPosts = await enrichPostsWithAuthorInfo([postData]);
    return enrichedPosts[0] || null;
  } catch (error) {
    console.error('게시물 조회 중 오류 발생:', error);
    return null;
  }
}
