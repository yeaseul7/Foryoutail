'use client';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { VscSend } from 'react-icons/vsc';
import { createHistory } from '@/lib/domain/community/history';

export default function WriteComment({
  postId,
}: {
  postId: string;
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
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .maybeSingle();

      if (postError) {
        throw postError;
      }

      if (!postData) {
        alert('게시물을 찾을 수 없습니다.');
        return;
      }

      const { data: commentRow, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.uid,
          content: comment.trim(),
          parent_id: null,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      if (postData.author_id) {
        await createHistory(
          postData.author_id,
          user.uid,
          'comment',
          'comment',
          commentRow.id,
          postId,
          commentRow.id,
        );
      }

      window.dispatchEvent(
        new CustomEvent('community-comments:changed', {
          detail: { postId },
        }),
      );

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
