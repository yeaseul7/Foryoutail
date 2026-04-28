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
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import Loading from '@/packages/components/base/Loading';
import NotFound from '@/packages/components/base/NotFound';
import WriteNotice from '../write/wrtieGuidLine';
import { uploadCardImages } from '@/lib/client/imageUpload';
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

  const mapPostRow = (row: {
    id: string;
    author_id: string | null;
    title: string;
    content: string | null;
    likes_count: number | null;
    created_at: string | null;
    updated_at: string | null;
    main_image_url: string | null;
    category?: string | null;
    tags?: string[] | null;
    view_count?: number | null;
  }): PostData => {
    const toTs = (value: string | null) =>
      value
        ? {
            seconds: Math.floor(new Date(value).getTime() / 1000),
            nanoseconds: 0,
          }
        : null;

    return {
      id: row.id,
      authorId: row.author_id ?? '',
      authorName: '',
      authorPhotoURL: null,
      title: row.title ?? '',
      content: row.content ?? '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      likes: row.likes_count ?? 0,
      thumbnail: row.main_image_url ?? null,
      createdAt: toTs(row.created_at),
      updatedAt: toTs(row.updated_at),
      category:
        row.category === 'daily' ||
        row.category === 'question' ||
        row.category === 'adoption' ||
        row.category === 'pet-life'
          ? row.category
          : undefined,
      viewCount: row.view_count ?? 0,
    };
  };

  useEffect(() => {
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

        if (data) {
          const mapped = mapPostRow(data);
          setPost(mapped);
          setWriteCategory(normalizeBoardCategory(mapped.category));
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
      let mainImageUrl = post.thumbnail ?? null;
      if (coverDraftFiles.length > 0) {
        const urls = await uploadCardImages(coverDraftFiles, 'boards');
        content = prependImageUrlsToHtmlContent(urls, content);
        mainImageUrl = urls[0] ?? mainImageUrl;
      }

      const trimmedTitle = (post.title ?? '').trim();
      const title =
        trimmedTitle || deriveBoardTitleFromHtml(content);

      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          tags: post.tags ?? [],
          category: writeCategory,
          main_image_url: mainImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('author_id', user.uid);

      if (error) {
        throw error;
      }

      alert('게시물이 성공적으로 수정되었습니다!');
      router.push(`/read/${postId}`);
    } catch (e) {
      console.error('게시물 수정 중 오류 발생:', e);

      const error = e as { code?: string; message?: string };
      if (error.code === '42501') {
        alert('권한이 없습니다. posts 테이블 RLS/권한 설정을 확인해주세요.');
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
