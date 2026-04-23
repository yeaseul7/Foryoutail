'use client';
import { firestore } from '@/lib/firebase/firebase';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
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
        const docRef = doc(firestore, 'boards', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as PostData;
          setPost(data);
        } else {
          setError('게시물을 찾을 수 없습니다.');
        }
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

        const postRef = doc(firestore, 'boards', postId);
        await updateDoc(postRef, { views: increment(1) });

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
  const optimizedContent = optimizeImageUrlsInHtml(content, 800);

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

              <div className="prose prose-sm sm:prose-base lg:prose-lg mx-auto max-w-[800px] [&_img]:mx-auto [&_img]:block [&_img]:max-w-[800px] [&_img]:max-h-[680px] [&_img]:w-auto [&_img]:h-auto">
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
