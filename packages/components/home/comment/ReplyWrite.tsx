'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import { VscSend } from 'react-icons/vsc';
import { createHistory } from '@/lib/domain/community/history';
import type { CommentCollectionName } from './CommentList';

export default function ReplyWrite({
  postId,
  commentId,
  collectionName = 'boards',
  onReplySubmitted,
}: {
  postId: string;
  commentId: string;
  collectionName?: CommentCollectionName;
  onReplySubmitted?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const lineHeight = 24;
      const fixedHeight = lineHeight * 3;

      textarea.style.height = `${fixedHeight}px`;
      textarea.style.overflowY = 'auto';
    }
  }, []);

  const handleCancel = useCallback(() => {
    setReply('');
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
    if (onReplySubmitted) {
      onReplySubmitted();
    }
  }, [onReplySubmitted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (reply.trim() || textareaRef.current?.value.trim()) {
          if (confirm('작성 중인 대댓글이 있습니다. 정말 닫으시겠습니까?')) {
            handleCancel();
          }
        } else {
          handleCancel();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [reply, handleCancel]);

  const handleSubmit = async () => {
    if (!reply.trim()) return;
    if (!user) {
      alert('대댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentRef = doc(
        firestore,
        collectionName,
        postId,
        'comments',
        commentId,
      );
      const commentDoc = await getDoc(commentRef);

      if (!commentDoc.exists()) {
        alert('댓글을 찾을 수 없습니다.');
        return;
      }

      const repliesCollection = collection(
        firestore,
        collectionName,
        postId,
        'comments',
        commentId,
        'replies',
      );
      const replyDocRef = await addDoc(repliesCollection, {
        content: reply.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        likes: 0,
      });

      await updateDoc(commentRef, {
        repliesCount: increment(1),
      });

      if (collectionName === 'boards') {
        const commentData = commentDoc.data();
        if (commentData?.authorId) {
          await createHistory(
            commentData.authorId,
            user.uid,
            'reply',
            'reply',
            replyDocRef.id,
            postId,
            commentId,
            replyDocRef.id,
          );
        }
      }

      setReply('');
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
      if (onReplySubmitted) {
        onReplySubmitted();
      }
    } catch (error) {
      console.error('대댓글 작성 중 오류 발생:', error);
      alert('대댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const replyLength = reply.length;
  const maxLength = 500;

  return (
    <div ref={containerRef} className="flex flex-col mt-2 w-full bg-white">
      <div className="flex flex-col gap-2 p-4 w-full rounded-md border border-gray-200">
        <textarea
          ref={textareaRef}
          placeholder="대댓글을 입력하세요 (Cmd/Ctrl + Enter로 전송)"
          value={reply}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setReply(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          className="overflow-y-auto w-full text-sm leading-6 outline-none resize-none"
          rows={3}
          disabled={isSubmitting}
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center">
          <span
            className={`text-xs ${replyLength >= maxLength
                ? 'text-red-500'
                : replyLength >= maxLength * 0.9
                  ? 'text-orange-500'
                  : 'text-gray-500'
              }`}
          >
            {replyLength}/{maxLength}
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-600 rounded-full border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              aria-label="취소"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !reply.trim() || isSubmitting || replyLength > maxLength
              }
              className="flex justify-center items-center p-2 text-white rounded-full transition-colors bg-primary1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary2"
              aria-label="대댓글 전송"
            >
              {isSubmitting ? (
                <span className="text-sm">전송 중...</span>
              ) : (
                <VscSend className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
