'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaHeart, FaRegComment, FaRegHeart, FaShare } from 'react-icons/fa6';
import { useLanguage } from '@/lib/i18n/language';
import type { CommunityPostDetail } from '@/lib/server/community-posts';
import { useAuth } from '@/lib/supabase/auth';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';

export default function CommunityPostEngagement({ post }: { post: CommunityPostDetail }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [likePending, setLikePending] = useState(false);
  const [sharePending, setSharePending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }

    let active = true;
    void (async () => {
      if (!(await loadSupabaseBrowserConfig())) return;
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', post.id)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (active) setLiked(Boolean(data));
    })();

    return () => { active = false; };
  }, [post.id, user]);

  const toggleLike = async () => {
    if (!user) {
      window.alert(t('로그인 후 좋아요를 누를 수 있어요.', 'Log in to like a post.'));
      return;
    }
    if (likePending) return;

    const nextLiked = !liked;
    setLikePending(true);
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    try {
      if (!(await loadSupabaseBrowserConfig())) throw new Error('Supabase is not configured');
      const { error } = nextLiked
        ? await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.uid })
        : await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.uid);
      if (error) throw error;
    } catch {
      setLiked(!nextLiked);
      setLikesCount((count) => Math.max(0, count + (nextLiked ? -1 : 1)));
    } finally {
      setLikePending(false);
    }
  };

  const sharePost = async () => {
    if (sharePending) return;
    setSharePending(true);

    try {
      const url = `${window.location.origin}/community/${post.slug}`;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      const response = await fetch(`/api/community/posts/${encodeURIComponent(post.slug)}/share`, { method: 'POST' });
      const body = await response.json() as { shareCount?: number };
      if (!response.ok || typeof body.shareCount !== 'number') throw new Error('Share count failed');
      setShareCount(body.shareCount);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.alert(t('링크를 복사하지 못했습니다.', 'Could not copy the link.'));
    } finally {
      setSharePending(false);
    }
  };

  return (
    <div className="mx-5 flex items-center gap-5 pb-4 pt-1 text-xs font-semibold text-[#817873] sm:mx-7">
      <button type="button" onClick={() => void toggleLike()} disabled={likePending} aria-pressed={liked} className={`inline-flex items-center gap-1.5 transition disabled:opacity-60 ${liked ? 'text-[#e75d68]' : 'hover:text-[#e75d68]'}`}>
        {liked ? <FaHeart className="text-xl" aria-hidden /> : <FaRegHeart className="text-xl" aria-hidden />}
        {likesCount}
      </button>
      <Link href="#comments" className="inline-flex items-center gap-1.5 transition hover:text-[#332d2a]">
        <FaRegComment className="text-xl" aria-hidden />
        {post.commentCount}
      </Link>
      <button type="button" onClick={() => void sharePost()} disabled={sharePending} className="inline-flex items-center gap-1.5 transition hover:text-primary1 disabled:opacity-50" aria-label={t('게시물 링크 복사', 'Copy post link')}>
        <FaShare className="text-xl" aria-hidden />
        {copied ? t('복사됨', 'Copied') : shareCount}
      </button>
    </div>
  );
}
