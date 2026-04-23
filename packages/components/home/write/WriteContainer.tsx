'use client';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import TagInput from '@/packages/components/home/write/TagInput';
import WriteBody from '@/packages/components/home/write/WriteBody';
import WriteFooter from '@/packages/components/home/write/WriteFooter';
import WriteHeader from '@/packages/components/home/write/WriteHeader';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  getBoardWriteGuidelineDismissedServerSnapshot,
  getBoardWriteGuidelineDismissedSnapshot,
  subscribeBoardWriteGuidelineDismissed,
} from '@/lib/community/boardWriteGuidelineStorage';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/navigation';
import type { PostBoardCategory, PostData } from '@/packages/type/postType';
import WriteNotice from './wrtieGuidLine';
import BlockingProgressOverlay from '@/packages/components/base/BlockingProgressOverlay';
import { uploadCardImages } from '@/lib/client/imageUpload';
import {
  deriveBoardTitleFromHtml,
  prependImageUrlsToHtmlContent,
} from '@/lib/utils/boardPost';

interface WriteContainerProps {
  className?: string;
  /** URL `?category=` 등에서 넘긴 초기 게시판 카테고리 */
  initialCategory?: PostBoardCategory;
}
export default function WriteContainer({ className, initialCategory }: WriteContainerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [postData, setPostData] = useState<PostData | null>(null);
  const [writeCategory, setWriteCategory] = useState<PostBoardCategory>(
    () => initialCategory ?? 'daily',
  );


  const [coverDraftFiles, setCoverDraftFiles] = useState<File[]>([]);
  type PostingOverlay =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; readId: string; message: string };
  const [postingOverlay, setPostingOverlay] = useState<PostingOverlay>({ kind: 'idle' });

  const guidelineDismissed = useSyncExternalStore(
    subscribeBoardWriteGuidelineDismissed,
    getBoardWriteGuidelineDismissedSnapshot,
    getBoardWriteGuidelineDismissedServerSnapshot,
  );

  const posting = useCallback(async () => {
    if (!user) {
      console.error('게시물을 작성하려면 로그인이 필요합니다.');
      alert('게시물을 작성하려면 로그인이 필요합니다.');
      return;
    }

    const editorHtml = postData?.content?.trim() ?? '';
    const hasTextBody = Boolean(editorHtml.replace(/<[^>]+>/g, '').trim());
    if (coverDraftFiles.length === 0 && !hasTextBody) {
      alert('사진을 올리거나 본문을 입력해 주세요.');
      return;
    }

    setPostingOverlay({ kind: 'loading' });
    try {
      let content = postData?.content ?? '';
      if (coverDraftFiles.length > 0) {
        const urls = await uploadCardImages(coverDraftFiles, 'boards');
        content = prependImageUrlsToHtmlContent(urls, content);
      }

      const titleFromForm = (postData?.title ?? '').trim();
      const title = titleFromForm || deriveBoardTitleFromHtml(content);

      const base: PostData = postData ?? {
        id: '',
        title: '',
        content: '',
        tags: [],
        authorId: '',
        authorName: '',
        authorPhotoURL: null,
        createdAt: null,
        updatedAt: null,
        likes: 0,
      };

      const postDataToSave = {
        ...base,
        title,
        content,
        category: writeCategory,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(firestore, 'boards'),
        postDataToSave,
      );
      setPostingOverlay({
        kind: 'success',
        readId: docRef.id,
        message: '성공했습니다!',
      });
    } catch (e) {
      console.error('게시물 생성 중 오류 발생: ', e);

      const error = e as { code?: string; message?: string };
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);

      setPostingOverlay({ kind: 'idle' });

      if (error.code === 'permission-denied') {
        alert(
          '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.\n\nFirebase 콘솔 > Firestore Database > 규칙에서 boards 컬렉션에 대한 쓰기 권한이 설정되어 있는지 확인하세요.',
        );
      } else {
        alert(
          `게시물 생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'
          }`,
        );
      }
    }
  }, [postData, writeCategory, user, coverDraftFiles]);

  useEffect(() => {
    if (postingOverlay.kind !== 'success') return;
    const { readId } = postingOverlay;
    const t = window.setTimeout(() => {
      router.push(`/read/${readId}`);
      setPostingOverlay({ kind: 'idle' });
    }, 1400);
    return () => window.clearTimeout(t);
  }, [postingOverlay, router]);

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
            <WriteBody postData={postData} setPostData={setPostData} />
          </div>
          <div className="shrink-0 mt-4">
            <TagInput
              postData={postData as PostData}
              setPostData={setPostData as Dispatch<SetStateAction<PostData | null>>}
              writeCategory={writeCategory}
            />
          </div>
          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4">
            <WriteFooter
              onSubmit={posting}
              isSubmitting={postingOverlay.kind !== 'idle'}
            />
          </div>
        </div>
      </div>
      <BlockingProgressOverlay
        open={postingOverlay.kind !== 'idle'}
        variant={postingOverlay.kind === 'success' ? 'success' : 'loading'}
        title={
          postingOverlay.kind === 'success'
            ? postingOverlay.message
            : '업로드 중'
        }
        subtitle={
          postingOverlay.kind === 'success'
            ? '잠시 후 글 화면으로 이동해요.'
            : '이미지를 올리고 게시글을 저장하고 있어요.'
        }
      />
      {!guidelineDismissed && (
        <div className="min-h-0 px-4 sm:px-6 lg:px-8">
          <WriteNotice />
        </div>
      )}
    </div>
  );
}
