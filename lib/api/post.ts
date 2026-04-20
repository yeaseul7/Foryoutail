import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { PostData } from '@/packages/type/postType';

const authorInfoCache = new Map<
  string,
  { nickname: string; photoURL: string | null; cachedAt: number }
>();

const CACHE_TTL = 5 * 60 * 1000;

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
          const userDoc = await getDoc(doc(firestore, 'users', authorId));
          let authorInfo: { nickname: string; photoURL: string | null };

          if (userDoc.exists()) {
            const userData = userDoc.data();
            authorInfo = {
              nickname: userData?.nickname || userData?.displayName || '',
              photoURL: userData?.photoURL || null,
            };
            // 개발 환경에서만 로그 출력
            if (process.env.NODE_ENV === 'development') {
              console.log(`작성자 ${authorId} 정보 가져오기 성공:`, {
                nickname: authorInfo.nickname,
                hasPhoto: !!authorInfo.photoURL,
              });
            }
          } else {
            console.warn(
              `작성자 ${authorId}의 users 문서가 존재하지 않습니다.`,
            );
            authorInfo = {
              nickname: '',
              photoURL: null,
            };
          }

          authorInfoCache.set(authorId, {
            ...authorInfo,
            cachedAt: now,
          });
          authorInfoMap.set(authorId, authorInfo);
        } catch (error) {
          const firebaseError = error as { code?: string; message?: string };
          if (firebaseError?.code === 'permission-denied') {
            console.warn(
              `작성자 ${authorId} 정보 가져오기 권한 오류:`,
              'Firestore 규칙이 아직 배포되지 않았거나, users 컬렉션에 대한 읽기 권한이 없습니다.',
              'Firebase 콘솔에서 firestore.rules를 배포했는지 확인하세요.',
            );
          } else {
            console.error(`작성자 ${authorId} 정보 가져오기 실패:`, error);
          }
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
  const boardsCol = collection(firestore, 'boards');
  const q = query(boardsCol, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PostData[];
  return await enrichPostsWithAuthorInfo(posts);
}

export async function getBoardsData(): Promise<PostData[]> {
  const boardsCol = collection(firestore, 'boards');
  const boardsSnapshot = await getDocs(boardsCol);
  const boardsList = boardsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PostData[];

  return await enrichPostsWithAuthorInfo(boardsList);
}

export async function getRecentBoardsData(
  limitCount: number = 20,
): Promise<PostData[]> {
  const boardsCol = collection(firestore, 'boards');
  const q = query(
    boardsCol,
    where('category', '==', 'adoption'),
    limit(limitCount)
  );
  const boardsSnapshot = await getDocs(q);
  const boardsList = boardsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PostData[];

  return await enrichPostsWithAuthorInfo(boardsList);
}

export async function getTrendingBoardsData(
  limitCount: number = 20,
): Promise<PostData[]> {
  try {
    const boardsCol = collection(firestore, 'boards');

    const qDailyLike = query(
      boardsCol,
      where('category', 'in', ['daily', 'pet-life']),
      limit(limitCount * 2),
    );

    const qAll = query(
      boardsCol,
      orderBy('createdAt', 'desc'),
      limit(limitCount * 3),
    );

    const [dailyLikeSnapshot, allSnapshot] = await Promise.all([
      getDocs(qDailyLike),
      getDocs(qAll),
    ]);

    const dailyLikePosts = dailyLikeSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PostData[];

    const allPosts = allSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PostData[];

    const noCategoryPosts = allPosts.filter(
      (post) => !post.category || post.category === undefined
    );

    const allFilteredPosts = [...dailyLikePosts, ...noCategoryPosts];
    const uniquePostsMap = new Map<string, PostData>();
    allFilteredPosts.forEach((post) => {
      if (!uniquePostsMap.has(post.id)) {
        uniquePostsMap.set(post.id, post);
      }
    });

    const sortedPosts = Array.from(uniquePostsMap.values())
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);

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
  const boardsCol = collection(firestore, 'boards');
  const endQuery = trimmedQuery + '\uf8ff';

  try {
    const titleQuery = query(
      boardsCol,
      where('title', '>=', trimmedQuery),
      where('title', '<=', endQuery),
    );

    const tagQuery = query(
      boardsCol,
      where('tags', 'array-contains', trimmedQuery),
    );

    const [titleSnapshot, tagSnapshot] = await Promise.all([
      getDocs(titleQuery),
      getDocs(tagQuery),
    ]);

    const boardsMap = new Map<string, PostData>();

    titleSnapshot.forEach((doc) => {
      boardsMap.set(doc.id, { id: doc.id, ...doc.data() } as PostData);
    });

    tagSnapshot.forEach((doc) => {
      boardsMap.set(doc.id, { id: doc.id, ...doc.data() } as PostData);
    });

    const filteredBoards = Array.from(boardsMap.values());

    filteredBoards.sort((a: PostData, b: PostData) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime; // 내림차순
    });

    return await enrichPostsWithAuthorInfo(filteredBoards);
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
    const docRef = doc(firestore, 'boards', postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const postData = { id: docSnap.id, ...docSnap.data() } as PostData;
      const enrichedPosts = await enrichPostsWithAuthorInfo([postData]);
      const post = enrichedPosts[0] || null;

      if (post) {
        // Timestamp를 직렬화 가능한 형태로 변환
        return JSON.parse(
          JSON.stringify(post, (key, value) => {
            // Firestore Timestamp 객체를 일반 객체로 변환
            if (
              value &&
              typeof value === 'object' &&
              value.constructor?.name === 'Timestamp'
            ) {
              const timestamp = value as Timestamp;
              return {
                seconds: timestamp.seconds,
                nanoseconds: timestamp.nanoseconds,
              };
            }
            // Timestamp와 유사한 객체도 변환 (seconds, nanoseconds 속성이 있는 경우)
            if (
              value &&
              typeof value === 'object' &&
              'seconds' in value &&
              'nanoseconds' in value &&
              typeof (value as { toDate?: () => Date }).toDate === 'function'
            ) {
              const timestampLike = value as {
                seconds: number;
                nanoseconds: number;
              };
              return {
                seconds: timestampLike.seconds,
                nanoseconds: timestampLike.nanoseconds,
              };
            }
            return value;
          }),
        ) as PostData;
      }

      return null;
    }

    return null;
  } catch (error) {
    console.error('게시물 조회 중 오류 발생:', error);
    return null;
  }
}
