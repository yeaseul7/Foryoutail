'use client';
import { getAllBoardsData } from '@/lib/api/post';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '../base/PostCard';
import PostCardSkeleton from '../base/PostCardSkeleton';
import { stripTagHashes } from '@/lib/community/boardSuggestedTags';
import { PostData } from '@/packages/type/postType';
import CommunityBoardHeader, {
  type CommunityBoardTabId,
} from '@/packages/ui/components/community/CommunityBoardHeader';

interface CommunityPostsProps {
  pageSize?: number;
  fromMain?: boolean;
}

function filterPostsByTab(posts: PostData[], tab: CommunityBoardTabId): PostData[] {
  if (tab === 'all') return posts;
  if (tab === 'adoption') return posts.filter((p) => p.category === 'adoption');
  if (tab === 'daily') {
    return posts.filter(
      (p) => p.category === 'daily' || p.category === 'pet-life' || !p.category,
    );
  }
  if (tab === 'question') {
    return posts.filter((p) => {
      if (p.category === 'question') return true;
      const tagCores = (p.tags || []).map((t) =>
        stripTagHashes(String(t)).toLowerCase(),
      );
      return tagCores.some(
        (t) => t.includes('질문') || t === 'qna' || t.includes('question'),
      );
    });
  }
  return posts;
}

export default function CommunityPosts({ pageSize = 12, fromMain = false }: CommunityPostsProps) {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<CommunityBoardTabId>('all');

  const filteredPosts = useMemo(
    () => filterPostsByTab(allPosts, activeTab),
    [allPosts, activeTab],
  );

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getAllBoardsData();
        setAllPosts(data);
      } catch (e) {
        console.error('게시물 조회 중 오류 발생:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    setDisplayedPosts(filteredPosts.slice(0, pageSize));
  }, [filteredPosts, pageSize]);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedPosts((prev) => filteredPosts.slice(0, prev.length + pageSize));
      setLoadingMore(false);
    }, 300);
  }, [filteredPosts, pageSize]);

  const hasMore = displayedPosts.length < filteredPosts.length;

  const emptyAll = allPosts.length === 0 && !loading;
  const emptyFiltered = !loading && allPosts.length > 0 && filteredPosts.length === 0;

  return (
    <div className="w-full">
      <CommunityBoardHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onWriteClick={() => router.push('/write')}
        onAskClick={() => router.push('/write?category=question')}
      />

      {emptyAll ? (
        <div className="px-4 py-12 text-center text-gray-500 sm:px-0">게시물이 없습니다.</div>
      ) : emptyFiltered ? (
        <div className="px-4 py-12 text-center text-gray-500 sm:px-0">조건에 맞는 게시글이 없습니다.</div>
      ) : null}

      {!emptyAll && !emptyFiltered && (
        <>
          <div className="grid grid-cols-1 gap-4 px-4 pb-8 pt-2 w-full sm:px-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <PostCardSkeleton key={`skeleton-${index}`} />
              ))
            ) : (
              <>
                {displayedPosts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    highPriority={index < pageSize}
                    highQuality={index < pageSize}
                  />
                ))}
                {loadingMore &&
                  Array.from({ length: pageSize }).map((_, index) => (
                    <PostCardSkeleton key={`skeleton-more-${index}`} />
                  ))}
              </>
            )}
          </div>

          {hasMore && !fromMain && (
            <div className="flex justify-center mt-8 mb-4 px-4 sm:px-0">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-primary1 hover:text-primary2 font-semibold
                       transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    로딩중...
                  </span>
                ) : (
                  '더보기'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
