'use client';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import PostCard from '../../base/PostCard';
import PostCardSkeleton from '../../skeleton/PostCardSkeleton';
import { PostData } from '@/packages/type/postType';
import { enrichPostsWithAuthorInfo } from '@/lib/domain/community/post';

export default function PostScrollList({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<PostData[]>([]); // 전체 게시물
  const [displayedPosts, setDisplayedPosts] = useState<PostData[]>([]); // 표시되는 게시물
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(6); // 처음 6개 표시

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        const boardsCol = collection(firestore, 'boards');
        const q = query(boardsCol, where('authorId', '==', targetUserId));
        const boardsSnapshot = await getDocs(q);

        const postsList = boardsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PostData[];

        // 클라이언트에서 최신순으로 정렬
        postsList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime; // 내림차순 (최신순)
        });

        // 작성자 정보 추가
        const postsWithAuthorInfo = await enrichPostsWithAuthorInfo(postsList);
        setAllPosts(postsWithAuthorInfo);
        setDisplayedPosts(postsWithAuthorInfo.slice(0, 6)); // 처음 6개만 표시
      } catch (error) {
        console.error('게시물 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [targetUserId]);

  const handleLoadMore = () => {
    setLoadingMore(true);

    setTimeout(() => {
      const nextCount = displayCount + 12;
      setDisplayedPosts(allPosts.slice(0, nextCount));
      setDisplayCount(nextCount);
      setLoadingMore(false);
    }, 300);
  };

  const hasMore = displayedPosts.length < allPosts.length;

  if (!targetUserId && !loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        사용자 정보를 불러올 수 없습니다.
      </div>
    );
  }

  if (allPosts.length === 0 && !loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        작성한 게시물이 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 pt-8 w-full md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // 초기 로딩 중에는 모든 Skeleton 표시
          Array.from({ length: 6 }).map((_, index) => (
            <PostCardSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          <>
            {displayedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {loadingMore && (
              // 더보기 로딩 중에는 추가 Skeleton 표시
              Array.from({ length: 12 }).map((_, index) => (
                <PostCardSkeleton key={`skeleton-more-${index}`} />
              ))
            )}
          </>
        )}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-primary1 hover:text-primary2 font-semibold 
                       transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                로딩중...
              </span>
            ) : (
              `더보기`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
