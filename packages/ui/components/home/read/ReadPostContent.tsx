'use client';
import { firestore } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { IoIosArrowBack } from 'react-icons/io';
import Loading from '@/packages/ui/components/base/Loading';
import NotFound from '@/packages/ui/components/base/NotFound';
import { PostData } from '@/packages/type/postType';
import ReadHeader from '@/packages/ui/components/home/read/ReadHeader';
import ReadFooter from '@/packages/ui/components/common/ReadFooter';
import Liked from '@/packages/ui/components/home/comment/Liked';
import { optimizeImageUrlsInHtml } from '@/packages/utils/optimization';

interface ReadPostContentProps {
  postId: string;
  initialPost?: PostData | null;
}

export default function ReadPostContent({
  postId,
  initialPost,
}: ReadPostContentProps) {
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(initialPost || null);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      if (editor && initialPost.content) {
        // 이미지 URL 최적화 후 콘텐츠 설정
        const optimizedContent = optimizeImageUrlsInHtml(initialPost.content);
        editor.commands.setContent(optimizedContent);
      }
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

          if (editor && data.content) {
            // 이미지 URL 최적화 후 콘텐츠 설정
            const optimizedContent = optimizeImageUrlsInHtml(data.content);
            editor.commands.setContent(optimizedContent);
          }
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
  }, [postId, editor, initialPost]);
  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <NotFound error={error} />;
  }

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

              <div className="max-w-none prose prose-sm sm:prose-base lg:prose-lg [&_img]:mx-auto [&_img]:block">
                {editor && (
                  <EditorContent editor={editor} className="tiptap" />
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
