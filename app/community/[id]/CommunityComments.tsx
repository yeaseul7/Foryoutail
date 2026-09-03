'use client';

import Image from 'next/image';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import { useLanguage } from '@/lib/i18n/language';
import { useAuth } from '@/lib/supabase/auth';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';
import { formatCommunityPostDate } from '@/packages/utils/communityDate';

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  deleted_at: string | null;
  like_count: number;
  created_at: string;
};

type CommentItem = CommentRow & {
  authorName: string | null;
  authorImageUrl: string | null;
};

export default function CommunityComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { isEnglish, t } = useLanguage();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set());
  const userName = user?.displayName || user?.email?.split('@')[0] || t('사용자', 'User');

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, { cache: 'no-store' });
    const body = await response.json() as { comments?: CommentItem[]; error?: string };
    if (!response.ok) throw new Error(body.error || '댓글 조회 실패');
    const nextComments = body.comments ?? [];
    setComments(nextComments);
    if (!user || !nextComments.length || !(await loadSupabaseBrowserConfig())) {
      setLikedCommentIds(new Set());
      return;
    }
    const { data } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.uid).in('comment_id', nextComments.map((comment) => comment.id));
    setLikedCommentIds(new Set((data ?? []).map((like) => like.comment_id)));
  }, [postId, user]);

  useEffect(() => {
    void loadComments()
      .catch((error) => { console.error('댓글 조회 실패:', error); setMessage(t('댓글을 불러오지 못했습니다.', 'Could not load comments.')); })
      .finally(() => setLoading(false));
  }, [loadComments, t]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!user) { setMessage(t('로그인 후 댓글을 작성할 수 있어요.', 'Log in to comment.')); return; }
    if (!normalizedContent || pending) return;
    setPending(true);
    setMessage('');
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.uid,
        content: normalizedContent,
        parent_id: null,
      });
      if (error) throw error;
      setContent('');
      await loadComments();
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      setMessage(t('댓글을 등록하지 못했습니다.', 'Could not post the comment.'));
    } finally { setPending(false); }
  };

  const deleteComment = async (commentId: string) => {
    if (pending || !window.confirm(t('댓글을 삭제할까요?', 'Delete this comment?'))) return;
    setPending(true);
    try {
      const { data, error } = await supabase.rpc('soft_delete_comment', { target_comment_id: commentId });
      if (error) throw error;
      if (!data) throw new Error('댓글 삭제 권한이 없습니다.');
      await loadComments();
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      setMessage(t('댓글을 삭제하지 못했습니다.', 'Could not delete the comment.'));
    } finally { setPending(false); }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) { setMessage(t('로그인 후 댓글에 좋아요를 누를 수 있어요.', 'Log in to like a comment.')); return; }
    if (pendingLikeIds.has(commentId)) return;
    const nextLiked = !likedCommentIds.has(commentId);
    setPendingLikeIds((current) => new Set(current).add(commentId));
    setLikedCommentIds((current) => { const next = new Set(current); if (nextLiked) next.add(commentId); else next.delete(commentId); return next; });
    setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, like_count: Math.max(0, comment.like_count + (nextLiked ? 1 : -1)) } : comment));
    try {
      if (!(await loadSupabaseBrowserConfig())) throw new Error('Supabase is not configured');
      const { error } = nextLiked
        ? await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.uid })
        : await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.uid);
      if (error) throw error;
    } catch {
      setLikedCommentIds((current) => { const next = new Set(current); if (nextLiked) next.delete(commentId); else next.add(commentId); return next; });
      setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, like_count: Math.max(0, comment.like_count + (nextLiked ? -1 : 1)) } : comment));
      setMessage(t('댓글 좋아요를 반영하지 못했습니다.', 'Could not update the comment like.'));
    } finally {
      setPendingLikeIds((current) => { const next = new Set(current); next.delete(commentId); return next; });
    }
  };

  return (
    <section id="comments" className="mx-5 border-t border-[#eee7e2] py-6 sm:mx-7">
      <h2 className="text-base font-extrabold text-[#332d2a]">{t(`댓글 ${comments.filter((comment) => !comment.deleted_at).length}`, `${comments.filter((comment) => !comment.deleted_at).length} comments`)}</h2>
      <form onSubmit={submitComment} className="mt-4 flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary1">
          {user?.photoURL ? <Image src={user.photoURL} alt="" fill sizes="40px" className="object-cover" /> : userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex min-h-12 min-w-0 flex-1 items-center rounded-full bg-[#f5f2ef] px-4 focus-within:ring-2 focus-within:ring-primary1/15">
          <input value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} disabled={pending} placeholder={user ? t(`${userName}님, 무슨 이야기를 나누고 싶으세요?`, `What would you like to share, ${userName}?`) : t('로그인 후 댓글을 작성할 수 있어요.', 'Log in to comment.')} className="min-w-0 flex-1 bg-transparent text-sm text-[#332d2a] outline-none placeholder:text-[#8f8782]" />
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary1 text-white transition hover:opacity-90 disabled:bg-[#d8d0cb] disabled:text-white/80"
            aria-label={pending ? t('댓글 등록 중', 'Posting comment') : t('댓글 전송', 'Send comment')}
          >
            <FaPaw className="text-base" aria-hidden />
          </button>
        </div>
      </form>
      {message && <p className="ml-[52px] mt-2 text-xs font-semibold text-alert">{message}</p>}
      <div className="mt-5 flex flex-col gap-5">
        {loading && <p className="text-sm text-[#817873]">{t('댓글을 불러오는 중...', 'Loading comments...')}</p>}
        {!loading && comments.map((comment) => {
          const authorName = comment.authorName || t('탈퇴한 사용자', 'Former member');
          return <article key={comment.id} className="flex gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-bold text-primary1">
              {comment.authorImageUrl && !comment.deleted_at ? <Image src={comment.authorImageUrl} alt="" fill sizes="36px" className="object-cover" /> : authorName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs"><strong className="truncate text-[#332d2a]">{authorName}</strong><time className="shrink-0 text-[#9a918b]">{formatCommunityPostDate(comment.created_at, isEnglish ? 'en-US' : 'ko-KR')}</time>{user?.uid === comment.author_id && !comment.deleted_at && <button type="button" disabled={pending} onClick={() => void deleteComment(comment.id)} className="ml-auto text-[#9a918b] hover:text-alert">{t('삭제', 'Delete')}</button>}</div>
              <p className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${comment.deleted_at ? 'text-[#9a918b]' : 'text-[#5f5752]'}`}>{comment.deleted_at ? t('삭제된 댓글입니다.', 'This comment was deleted.') : comment.content}</p>
              {!comment.deleted_at && <button type="button" onClick={() => void toggleCommentLike(comment.id)} disabled={pendingLikeIds.has(comment.id)} aria-pressed={likedCommentIds.has(comment.id)} className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold transition disabled:opacity-50 ${likedCommentIds.has(comment.id) ? 'text-[#e75d68]' : 'text-[#9a918b] hover:text-[#e75d68]'}`}>{likedCommentIds.has(comment.id) ? <FaHeart aria-hidden /> : <FaRegHeart aria-hidden />}{comment.like_count ?? 0}</button>}
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}
