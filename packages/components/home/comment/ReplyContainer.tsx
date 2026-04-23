import { ReplyData } from '@/packages/type/commentType';
import type { CommentCollectionName } from './CommentList';
import { useMemo, useState } from 'react';
import { doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import { formatDate } from '@/packages/utils/dateFormatting';
import UserProfile from '../../common/UserProfile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { deleteHistoryByReplyId } from '@/lib/domain/community/history';

export default function ReplyContainer({
  replyData,
  postId,
  commentId,
  collectionName = 'boards',
}: {
  replyData: ReplyData;
  postId: string;
  commentId: string;
  collectionName?: CommentCollectionName;
}) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const { photoURL, nickname, loading } = useUserProfile(
    replyData.authorId,
    '탈퇴한 사용자',
    null,
  );

  const isMine = useMemo(
    () => user?.uid === replyData.authorId,
    [user, replyData.authorId],
  );

  const handleDelete = async () => {
    if (!user) {
      alert('대댓글을 삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (!confirm('대댓글을 삭제하시겠습니까?')) {
      return;
    }

    if (!postId || !commentId || !replyData.id || isDeleting) return;

    setIsDeleting(true);
    try {
      const replyRef = doc(
        firestore,
        collectionName,
        postId,
        'comments',
        commentId,
        'replies',
        replyData.id,
      );
      if (collectionName === 'boards') {
        await deleteHistoryByReplyId(
          replyData.id,
          postId,
          commentId,
          replyData.authorId,
        );
      }

      await deleteDoc(replyRef);

      const commentRef = doc(
        firestore,
        collectionName,
        postId,
        'comments',
        commentId,
      );
      await updateDoc(commentRef, {
        repliesCount: increment(-1),
      });
    } catch (error) {
      console.error('대댓글 삭제 중 오류 발생:', error);
      alert('대댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <UserProfile
                profileUrl={photoURL || ''}
                profileName={nickname || ''}
                imgSize={32}
                sizeClass="w-8 h-8"
                existName={false}
                iconSize="text-sm"
              />
            )}
          </div>
          <div className="flex flex-col gap-1 items-center">
            <div className="text-sm font-semibold text-gray-900">
              {loading ? (
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                nickname
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(replyData.createdAt)}
            </div>
          </div>
        </div>
        {isMine && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-700"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        )}
      </div>
      <div className="my-2 ml-2 text-sm text-gray-700 whitespace-pre-wrap">
        {replyData.content}
      </div>
    </div>
  );
}
