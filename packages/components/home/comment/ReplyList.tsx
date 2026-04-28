'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ReplyData } from '@/packages/type/commentType';
import ReplyContainer from './ReplyContainer';
import ReplyWrite from './ReplyWrite';
import DecorateHr from '../../base/DecorateHr';
import { useClickOutside } from '@/packages/utils/clickEvent';

export default function ReplyList({
  postId,
  commentId,
  onReplyListClosed,
}: {
  postId: string;
  commentId: string;
  onReplyListClosed: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchReplies = async () => {
      if (!postId || !commentId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('comments')
          .select('id, author_id, content, created_at')
          .eq('post_id', postId)
          .eq('parent_id', commentId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const repliesList = (data ?? []).map((row) => ({
          id: row.id,
          authorId: row.author_id ?? '',
          content: row.content,
          createdAt: row.created_at
            ? {
                seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
                nanoseconds: 0,
              }
            : null,
          likes: 0,
        })) as ReplyData[];

        setReplies(repliesList);
      } catch (error) {
        console.error('대댓글 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchReplies();

    const handleChanged = (event: Event) => {
      const detail = (
        event as CustomEvent<{ postId?: string; commentId?: string }>
      ).detail;
      if (detail?.postId === postId && detail?.commentId === commentId) {
        setLoading(true);
        void fetchReplies();
      }
    };

    window.addEventListener('community-comments:changed', handleChanged);
    return () => {
      window.removeEventListener('community-comments:changed', handleChanged);
    };
  }, [postId, commentId]);

  useClickOutside(containerRef, () => onReplyListClosed());

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-gray-500">
        대댓글을 불러오는 중...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 p-4 bg-gray-50 rounded-md"
    >
      {replies.map((reply, index) => (
        <div key={reply.id} className="flex flex-col">
          <ReplyContainer
            replyData={reply}
            postId={postId}
            commentId={commentId}
          />
          {index !== replies.length - 1 && <DecorateHr />}
        </div>
      ))}
      <ReplyWrite postId={postId} commentId={commentId} />
    </div>
  );
}
