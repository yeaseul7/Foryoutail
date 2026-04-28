'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CommentData } from '@/packages/type/commentType';
import { BsHeart, BsPlusSquare } from 'react-icons/bs';
import ReplyWrite from './ReplyWrite';
import ReplyList from './ReplyList';

export default function CommentFooter({
  commentData,
  postId,
}: {
  commentData: CommentData;
  postId: string;
}) {
  const [likes, setLikes] = useState<number>(commentData.likes || 0);
  const [loading, setLoading] = useState(true);
  const [isReplyWriting, setIsReplyWriting] = useState(false);
  const [isReplyListOpen, setIsReplyListOpen] = useState(false);
  const [replyCount, setReplyCount] = useState<number>(0);
  useEffect(() => {
    const fetchReplyCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId)
          .eq('parent_id', commentData.id);

        if (error) {
          throw error;
        }

        setReplyCount(count ?? 0);
        setLikes(0);
      } catch (error) {
        console.error('대댓글 개수 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchReplyCount();

    const handleChanged = (event: Event) => {
      const detail = (
        event as CustomEvent<{ postId?: string; commentId?: string }>
      ).detail;
      if (
        detail?.postId === postId &&
        (!detail?.commentId || detail.commentId === commentData.id)
      ) {
        void fetchReplyCount();
      }
    };

    window.addEventListener('community-comments:changed', handleChanged);
    return () => {
      window.removeEventListener('community-comments:changed', handleChanged);
    };
  }, [postId, commentData.id]);

  const handleReply = () => {
    setIsReplyWriting((prev) => !prev);
  };

  const handleLike = () => {
    alert('댓글 좋아요는 아직 별도 테이블이 필요합니다.');
  };

  if (loading) {
    return (
      <div className="flex gap-2 justify-between items-center mt-4">
        <div></div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 items-center text-gray-400">
            <BsHeart />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mx-4 mt-2">
      <div className="flex gap-2 justify-between items-center w-full">
        <div>
          {replyCount > 0 ? (
            <button
              onClick={() => setIsReplyListOpen((prev) => !prev)}
              className="flex gap-1 items-center text-xs text-primary1"
            >
              <BsPlusSquare className="w-3 h-3" />
              {replyCount}개의 대댓글
            </button>
          ) : (
            <button
              onClick={handleReply}
              className="flex gap-1 items-center text-xs text-primary1"
            >
              <BsPlusSquare className="w-3 h-3" />
              답글 달기
            </button>
          )}
        </div>
        <button
          onClick={handleLike}
          className="flex gap-1 items-center text-gray-300 cursor-not-allowed"
        >
          <BsHeart />
          {likes > 0 && <span className="text-sm">{likes}</span>}
        </button>
      </div>

      {isReplyWriting && commentData.id && (
        <ReplyWrite
          postId={postId}
          commentId={commentData.id}
          onReplySubmitted={() => setIsReplyWriting(false)}
        />
      )}
      {isReplyListOpen && commentData.id && (
        <ReplyList
          postId={postId}
          commentId={commentData.id}
          onReplyListClosed={() => setIsReplyListOpen(false)}
        />
      )}
    </div>
  );
}
