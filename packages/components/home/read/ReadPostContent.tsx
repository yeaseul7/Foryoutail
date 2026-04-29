'use client';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IoIosArrowBack } from 'react-icons/io';
import Loading from '@/packages/components/base/Loading';
import NotFound from '@/packages/components/base/NotFound';
import { PostData } from '@/packages/type/postType';
import ReadHeader from '@/packages/components/home/read/ReadHeader';
import ReadFooter from '@/packages/components/common/ReadFooter';
import Liked from '@/packages/components/home/comment/Liked';
import { optimizeImageUrlsInHtml } from '@/packages/utils/optimization';

interface ReadPostContentProps {
  postId: string;
  initialPost?: PostData | null;
}

const hasHtmlTag = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content);

export default function ReadPostContent({
  postId,
  initialPost,
}: ReadPostContentProps) {
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(initialPost || null);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const countedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      if (!postId) {
        setError('게시물 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, author_id, title, content, likes_count, created_at, updated_at, main_image_url, category, tags, view_count')
          .eq('id', postId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('게시물을 찾을 수 없습니다.');
          return;
        }

        const createdAt = data.created_at
          ? {
              seconds: Math.floor(new Date(data.created_at).getTime() / 1000),
              nanoseconds: 0,
            }
          : null;
        const updatedAt = data.updated_at
          ? {
              seconds: Math.floor(new Date(data.updated_at).getTime() / 1000),
              nanoseconds: 0,
            }
          : null;

        setPost({
          id: data.id,
          authorId: data.author_id ?? '',
          authorName: '',
          authorPhotoURL: null,
          title: data.title ?? '',
          content: data.content ?? '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          likes: data.likes_count ?? 0,
          thumbnail: data.main_image_url ?? null,
          createdAt,
          updatedAt,
          category:
            data.category === 'daily' ||
            data.category === 'question' ||
            data.category === 'adoption' ||
            data.category === 'pet-life'
              ? data.category
              : undefined,
          viewCount: data.view_count ?? 0,
        });
      } catch (e) {
        console.error('게시물 조회 중 오류 발생:', e);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, initialPost]);

  useEffect(() => {
    if (!postId || typeof window === 'undefined') return;
    if (countedRef.current === postId) return;

    const VIEWED_POSTS_KEY = 'viewed_posts';
    const markViewedOnce = async () => {
      try {
        const raw = localStorage.getItem(VIEWED_POSTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const viewedPosts = Array.isArray(parsed) ? (parsed as string[]) : [];

        if (viewedPosts.includes(postId)) {
          countedRef.current = postId;
          return;
        }

        await fetch(`/api/posts/${encodeURIComponent(postId)}/view`, {
          method: 'POST',
        });

        const nextViewed = [...viewedPosts, postId].slice(-300);
        localStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify(nextViewed));
        countedRef.current = postId;
      } catch (e) {
        console.error('조회수 업데이트 실패:', e);
      }
    };

    void markViewedOnce();
  }, [postId]);
  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <NotFound error={error} />;
  }

  const content = post?.content ?? '';
  const optimizedContent = optimizeImageUrlsInHtml(content, 680);

  return (
    <div className="w-full px-0 lg:px-8">
      {!loading && !error && post && (
        <div className="mx-auto w-full max-w-4xl">
          {canGoBack && (
            <button
              onClick={() => router.back()}
              className="flex gap-2 items-center px-4 my-4 text-gray-600 sm:px-6 sm:my-6 lg:px-8 hover:text-gray-800"
            >
              <IoIosArrowBack />
              뒤로가기
            </button>
          )}

          <div className="relative w-full">
            <article className="px-4 py-0 w-full sm:px-6 sm:py-2 lg:px-8 lg:py-3">
              <ReadHeader post={post} isEditing={false} />

              <div className="prose prose-sm sm:prose-base lg:prose-lg mx-auto max-w-[760px] [&_img]:mx-auto [&_img]:my-8 sm:[&_img]:my-10 [&_img]:block [&_img]:max-w-full [&_img]:w-auto [&_img]:h-auto [&_img]:rounded-2xl [&_img]:shadow-sm sm:[&_img]:max-w-[620px] lg:[&_img]:max-w-[680px] [&_img]:max-h-[520px] sm:[&_img]:max-h-[560px] lg:[&_img]:max-h-[620px]">
                {hasHtmlTag(optimizedContent) ? (
                  <div
                    className="post-content"
                    dangerouslySetInnerHTML={{ __html: optimizedContent }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {optimizedContent}
                  </div>
                )}
              </div>
              <Liked />
            </article>
          </div>
          <ReadFooter type="post" post={post} postId={postId} />
        </div>
      )}
    </div>
  );
}
