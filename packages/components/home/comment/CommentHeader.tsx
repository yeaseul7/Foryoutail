import { useAuth } from '@/lib/supabase/auth';
import { CommentData } from '@/packages/type/commentType';
import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/packages/utils/dateFormatting';
import { deleteHistoryByCommentId } from '@/lib/domain/community/history';

export default function CommentHeader({
  commentData,
  postId,
  isLoadingAuthorInfo,
}: {
  commentData: CommentData;
  postId: string;
  isLoadingAuthorInfo?: boolean;
}) {
  const { authorName, createdAt } = commentData;
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const isMine = useMemo(
    () => user?.uid === commentData.authorId,
    [user, commentData.authorId],
  );

  const handleDelete = async () => {
    if (!user) {
      alert('댓글을 삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    if (!postId || !commentData.id || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteHistoryByCommentId(
        commentData.id,
        postId,
        commentData.authorId,
      );

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentData.id)
        .eq('post_id', postId)
        .eq('author_id', user.uid);

      if (error) {
        throw error;
      }

      window.dispatchEvent(
        new CustomEvent('community-comments:changed', {
          detail: { postId, commentId: commentData.id },
        }),
      );
    } catch (error) {
      console.error('댓글 삭제 중 오류 발생:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingAuthorInfo) {
    return (
      <div className="flex justify-between w-full">
        <div className="flex gap-2 items-center">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 items-center"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-2 items-center">
        <span className="text-sm font-semibold text-gray-900">
          {authorName}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
        {isMine && (
          <>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
