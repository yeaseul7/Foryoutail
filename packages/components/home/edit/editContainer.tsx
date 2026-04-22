'use client';
import { useParams, useRouter } from 'next/navigation';
import TagInput from '../write/TagInput';
import WriteBody from '../write/WriteBody';
import WriteFooter from '../write/WriteFooter';
import WriteHeader from '../write/WriteHeader';
import {
  getBoardWriteGuidelineDismissedServerSnapshot,
  getBoardWriteGuidelineDismissedSnapshot,
  subscribeBoardWriteGuidelineDismissed,
} from '@/lib/community/boardWriteGuidelineStorage';
import { Dispatch, SetStateAction, useEffect, useState, useSyncExternalStore } from 'react';
import type { PostBoardCategory, PostCategoryStored, PostData } from '@/packages/type/postType';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import Loading from '@/packages/components/base/Loading';
import NotFound from '@/packages/components/base/NotFound';
import WriteNotice from '../write/wrtieGuidLine';
import { uploadCardImages } from '@/lib/client/cloudinary';
import {
  deriveBoardTitleFromHtml,
  prependImageUrlsToHtmlContent,
} from '@/lib/utils/boardPost';

export default function EditContainer({ className }: { className?: string }) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.id as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writeCategory, setWriteCategory] = useState<PostBoardCategory>('daily');
  const [coverDraftFiles, setCoverDraftFiles] = useState<File[]>([]);

  const guidelineDismissed = useSyncExternalStore(
    subscribeBoardWriteGuidelineDismissed,
    getBoardWriteGuidelineDismissedSnapshot,
    getBoardWriteGuidelineDismissedServerSnapshot,
  );

  const normalizeBoardCategory = (raw: PostCategoryStored | undefined): PostBoardCategory => {
    if (raw === 'adoption' || raw === 'question' || raw === 'daily') return raw;
    return 'daily';
  };
  useEffect(() => {
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
          setPost({ ...data, id: docSnap.id });
          // 카테고리 초기값 설정
          setWriteCategory(normalizeBoardCategory(data.category));
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
  }, [postId]);

  const updatePost = async () => {
    if (!post) return;

    if (!user) {
      alert('게시물을 수정하려면 로그인이 필요합니다.');
      return;
    }

    // 작성자 확인
    if (post.authorId !== user.uid) {
      alert('본인이 작성한 게시물만 수정할 수 있습니다.');
      return;
    }

    try {
      let content = post.content ?? '';
      if (coverDraftFiles.length > 0) {
        const urls = await uploadCardImages(coverDraftFiles, 'boards');
        content = prependImageUrlsToHtmlContent(urls, content);
      }

      const trimmedTitle = (post.title ?? '').trim();
      const title =
        trimmedTitle || deriveBoardTitleFromHtml(content);

      await updateDoc(doc(firestore, 'boards', postId), {
        title,
        content,
        tags: post.tags ?? [],
        category: writeCategory,
        updatedAt: serverTimestamp(),
      });
      alert('게시물이 성공적으로 수정되었습니다!');
      router.push(`/read/${postId}`);
    } catch (e) {
      console.error('게시물 수정 중 오류 발생:', e);

      const error = e as { code?: string; message?: string };
      if (error.code === 'permission-denied') {
        alert(
          '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.\n\n' +
          'Firebase 콘솔 > Firestore Database > 규칙에서 boards 컬렉션에 대한 업데이트 권한이 설정되어 있는지 확인하세요.\n\n' +
          '예시 규칙:\n' +
          'match /boards/{document=**} {\n' +
          '  allow update: if request.auth != null && request.auth.uid == resource.data.authorId;\n' +
          '}',
        );
      } else {
        alert(
          `게시물 수정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'
          }`,
        );
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !post) {
    return <NotFound error={error || '게시물을 찾을 수 없습니다.'} />;
  }

  return (
    <div
      className={`grid h-full min-h-0 w-full gap-4 ${guidelineDismissed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[7fr_3fr]'} ${className || ''}`}
    >
      <div
        className={`flex min-h-0 w-full flex-col ${guidelineDismissed ? 'lg:mx-auto lg:max-w-4xl' : ''}`}
      >
        <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-6 lg:p-8 bg-white rounded-2xl"
          style={{ boxShadow: '0 0 6px 0 rgba(0, 0, 0, 0.05)' }}
        >
          <div className="shrink-0 mb-4">
            <WriteHeader
              writeCategory={writeCategory}
              setWriteCategory={setWriteCategory}
              coverFiles={coverDraftFiles}
              onCoverFilesChange={setCoverDraftFiles}
            />
          </div>

          <div className="flex-1 min-h-0">
            <WriteBody postData={post} setPostData={setPost as Dispatch<SetStateAction<PostData | null>>} />
          </div>
          <div className="shrink-0 mt-4">
            <TagInput
              postData={post}
              setPostData={setPost as Dispatch<SetStateAction<PostData | null>>}
              writeCategory={writeCategory}
            />
          </div>
          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4">
            <WriteFooter onSubmit={updatePost} />
          </div>
        </div>
      </div>
      {!guidelineDismissed && (
        <div className="min-h-0 px-4 sm:px-6 lg:px-8">
          <WriteNotice />
        </div>
      )}
    </div>
  );
}
