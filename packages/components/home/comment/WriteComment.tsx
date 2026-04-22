'use client';
import { useRef, useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import { VscSend } from 'react-icons/vsc';
import { createHistory } from '@/lib/domain/community/history';
import type { CommentCollectionName } from './CommentList';

export default function WriteComment({
  postId,
  collectionName = 'boards',
}: {
  postId: string;
  collectionName?: CommentCollectionName;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [comment, setComment] = useState('');
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

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    if (!user) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = doc(firestore, collectionName, postId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert(collectionName === 'boards' ? '게시물을 찾을 수 없습니다.' : '공지를 찾을 수 없습니다.');
        return;
      }

      const commentsCollection = collection(
        firestore,
        collectionName,
        postId,
        'comments',
      );
      const commentDocRef = await addDoc(commentsCollection, {
        content: comment.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        likes: 0,
      });

      if (collectionName === 'boards') {
        const postData = docSnap.data();
        if (postData?.authorId) {
          await createHistory(
            postData.authorId,
            user.uid,
            'comment',
            'comment',
            commentDocRef.id,
            postId,
            commentDocRef.id,
          );
        }
      }

      setComment('');
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
    } catch (error) {
      console.error('댓글 작성 중 오류 발생:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
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

  const commentLength = comment.length;
  const maxLength = 500;

  return (
    <div className="flex flex-col p-4 px-4 sm:px-10 w-full">
      <div className="flex flex-col gap-3 p-4 w-full bg-white rounded-xl border border-gray-200 shadow-sm transition-all focus-within:border-primary1 focus-within:shadow-md">
        <textarea
          ref={textareaRef}
          placeholder="댓글을 입력하세요 (Cmd/Ctrl + Enter로 전송)"
          value={comment}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setComment(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          className="overflow-y-auto w-full text-sm leading-6 bg-transparent outline-none resize-none placeholder:text-gray-400"
          rows={3}
          disabled={isSubmitting}
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span
            className={`text-xs font-medium ${commentLength >= maxLength
                ? 'text-red-500'
                : commentLength >= maxLength * 0.9
                  ? 'text-orange-500'
                  : 'text-gray-400'
              }`}
          >
            {commentLength}/{maxLength}
          </span>
          <button
            onClick={handleSubmit}
            disabled={
              !comment.trim() || isSubmitting || commentLength > maxLength
            }
            className="flex gap-2 justify-center items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all bg-primary1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary2 hover:shadow-md"
            aria-label="댓글 전송"
          >
            {isSubmitting ? (
              <span>전송 중...</span>
            ) : (
              <>
                <VscSend className="w-4 h-4" />
                <span>전송</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
