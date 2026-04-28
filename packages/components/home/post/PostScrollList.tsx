'use client';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import PostCard from '../../base/PostCard';
import PostCardSkeleton from '../../skeleton/PostCardSkeleton';
import { PostData } from '@/packages/type/postType';

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
        const [postsResult, userResponse] = await Promise.all([
          supabase
            .from('posts')
            .select('id, author_id, title, content, likes_count, created_at, updated_at, main_image_url, category, tags, view_count')
            .eq('author_id', targetUserId)
            .order('created_at', { ascending: false }),
          fetch(`/api/supabase/users/sync?id=${encodeURIComponent(targetUserId)}`),
        ]);

        if (postsResult.error) {
          throw postsResult.error;
        }

        const userBody = userResponse.ok
          ? ((await userResponse.json()) as {
              user?: { nickname?: string | null; profile_img?: string | null } | null;
            })
          : { user: null };

        const postsList = (postsResult.data ?? []).map((row) => {
          const createdAt = row.created_at
            ? {
                seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
                nanoseconds: 0,
              }
            : null;
          const updatedAt = row.updated_at
            ? {
                seconds: Math.floor(new Date(row.updated_at).getTime() / 1000),
                nanoseconds: 0,
              }
            : null;

          return {
            id: row.id,
            title: row.title ?? '',
            content: row.content ?? '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            authorId: row.author_id ?? '',
            authorName: userBody.user?.nickname || '',
            authorPhotoURL: userBody.user?.profile_img || null,
            createdAt,
            updatedAt,
            thumbnail: row.main_image_url ?? null,
            likes: row.likes_count ?? 0,
            category:
              row.category === 'daily' ||
              row.category === 'question' ||
              row.category === 'adoption' ||
              row.category === 'pet-life'
                ? row.category
                : undefined,
            viewCount: row.view_count ?? 0,
          } as PostData;
        });
        setAllPosts(postsList);
        setDisplayedPosts(postsList.slice(0, 6));
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
