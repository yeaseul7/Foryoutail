'use client';

import { PostData } from '@/packages/type/postType';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { getSupabaseAccessToken } from '@/lib/supabase/client';
import UserProfile from '../../common/UserProfile';
import { formatDateSimple } from '@/packages/utils/dateFormatting';
import BlockingProgressOverlay from '@/packages/components/base/BlockingProgressOverlay';

export default function ReadHeader({
  post,
  isEditing,
}: {
  post: PostData | null;
  isEditing: boolean;
}) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [authorNickname, setAuthorNickname] = useState<string>('');
  const [authorPhotoURL, setAuthorPhotoURL] = useState<string | null>(null);

  type DeleteOverlay =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'success'; message: string; redirectTo: string };
  const [deleteOverlay, setDeleteOverlay] = useState<DeleteOverlay>({ kind: 'idle' });

  const postId = params.id as string;

  useEffect(() => {
    const fetchAuthorInfo = async () => {
      if (!post?.authorId) {
        setAuthorNickname('');
        setAuthorPhotoURL(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/supabase/users/sync?id=${encodeURIComponent(post.authorId)}`,
        );
        if (!response.ok) {
          throw new Error('작성자 조회 실패');
        }
        const body = (await response.json()) as {
          user?: { nickname?: string | null; profile_img?: string | null } | null;
        };
        setAuthorNickname(
          body.user?.nickname || post?.authorName || '탈퇴한 사용자',
        );
        setAuthorPhotoURL(body.user?.profile_img || post?.authorPhotoURL || null);
      } catch (error) {
        console.error('작성자 정보 가져오기 실패:', error);
        setAuthorNickname(post?.authorName || '탈퇴한 사용자');
        setAuthorPhotoURL(post?.authorPhotoURL || null);
      }
    };

    fetchAuthorInfo();
  }, [post?.authorId, post?.authorName, post?.authorPhotoURL]);

  const handleEdit = useCallback(() => {
    router.push(`/edit/${postId}`);
  }, [router, postId]);

  const handleDelete = useCallback(async () => {
    if (!user) {
      alert('게시물을 삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (!post) {
      alert('게시물 정보를 불러올 수 없습니다.');
      return;
    }

    if (post.authorId !== user.uid) {
      alert('본인이 작성한 게시물만 삭제할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm('게시물을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    setDeleteOverlay({ kind: 'loading' });
    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || '게시물 삭제에 실패했습니다.');
      }

      setDeleteOverlay({
        kind: 'success',
        message: '성공했습니다!',
        redirectTo: '/community',
      });
    } catch (e) {
      console.error('게시물 삭제 중 오류 발생:', e);

      setDeleteOverlay({ kind: 'idle' });

      const error = e as { code?: string; message?: string };
      alert(
        `게시물 삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'
        }`,
      );
    }
  }, [postId, user, post]);

  useEffect(() => {
    if (deleteOverlay.kind !== 'success') return;
    const { redirectTo } = deleteOverlay;
    const t = window.setTimeout(() => {
      router.push(redirectTo);
      setDeleteOverlay({ kind: 'idle' });
    }, 1400);
    return () => window.clearTimeout(t);
  }, [deleteOverlay, router]);

  const deleteBusy = deleteOverlay.kind !== 'idle';

  return (
    <header className="mb-6">
      <BlockingProgressOverlay
        open={deleteBusy}
        variant={deleteOverlay.kind === 'success' ? 'success' : 'loading'}
        title={
          deleteOverlay.kind === 'success'
            ? deleteOverlay.message
            : '삭제 중'
        }
        subtitle={
          deleteOverlay.kind === 'success'
            ? '잠시 후 커뮤니티로 이동해요.'
            : '게시글을 삭제하고 있어요.'
        }
      />
      <h1 className="mb-4 text-xl font-bold sm:text-2xl lg:text-3xl">{post?.title}</h1>

      <div className="flex gap-4 justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <button onClick={() => router.push(`/posts/${post?.authorId}`)}>
            <UserProfile
              profileUrl={authorPhotoURL || ''}
              profileName={authorNickname || ''}
              imgSize={28}
              sizeClass="w-7 h-7"
              existName={false}
              iconSize="text-lg"
            />
          </button>
          <div className="flex gap-2 items-center">
            <div className="pr-2 text-base font-semibold">
              {authorNickname || post?.authorName || '탈퇴한 사용자'}
            </div>
            {post?.createdAt && (
              <div className="text-sm text-gray-500">
                {formatDateSimple(post.createdAt)}
              </div>
            )}
          </div>
        </div>
        {post?.authorId === user?.uid && (
          <div className="flex gap-1 items-center">
            {!isEditing && (
              <button
                type="button"
                onClick={handleEdit}
                disabled={deleteBusy}
                className="px-2 py-1 text-gray-500 whitespace-nowrap transition-colors cursor-pointer shrink-0 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
              >
                수정
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleteBusy}
              className="px-2 py-1 text-gray-500 whitespace-nowrap transition-colors cursor-pointer shrink-0 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {post?.tags && post?.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post?.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-primary1/15 bg-[linear-gradient(180deg,rgba(107,133,227,0.14)_0%,rgba(107,133,227,0.08)_100%)] px-3 py-1.5 text-[13px] font-semibold tracking-[-0.01em] text-primary1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
