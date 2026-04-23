'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { ReplyData } from '@/packages/type/commentType';
import type { CommentCollectionName } from './CommentList';
import ReplyContainer from './ReplyContainer';
import ReplyWrite from './ReplyWrite';
import DecorateHr from '../../base/DecorateHr';
import { useClickOutside } from '@/packages/utils/clickEvent';

export default function ReplyList({
  postId,
  commentId,
  collectionName = 'boards',
  onReplyListClosed,
}: {
  postId: string;
  commentId: string;
  collectionName?: CommentCollectionName;
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
        const repliesCollection = collection(
          firestore,
          collectionName,
          postId,
          'comments',
          commentId,
          'replies',
        );
        const q = query(repliesCollection, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const repliesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as unknown as ReplyData[];
          setReplies(repliesList);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('대댓글 조회 중 오류 발생:', error);
        setLoading(false);
      }
    };

    fetchReplies();
  }, [postId, commentId, collectionName]);

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
            collectionName={collectionName}
          />
          {index !== replies.length - 1 && <DecorateHr />}
        </div>
      ))}
      <ReplyWrite postId={postId} commentId={commentId} collectionName={collectionName} />
    </div>
  );
}
