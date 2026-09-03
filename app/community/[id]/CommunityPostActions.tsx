'use client';

import Image from 'next/image';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronRight, FaEllipsis, FaXmark } from 'react-icons/fa6';
import type { CommunityPostDetail } from '@/lib/server/community-posts';
import { useLanguage } from '@/lib/i18n/language';
import { useAuth } from '@/lib/supabase/auth';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';

function storagePath(url: string): string | null {
  const marker = '/storage/v1/object/public/community-images/';
  try {
    const pathname = new URL(url).pathname;
    const index = pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

export default function CommunityPostActions({ post }: { post: CommunityPostDetail }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const richEditorRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [topic, setTopic] = useState(post.topic ?? '');
  const [content, setContent] = useState(post.content);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const isOwner = Boolean(user && post.authorId === user.uid);
  const userName = user?.displayName || user?.email?.split('@')[0] || t('사용자', 'User');

  useEffect(() => {
    if (!editing) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [editing]);

  if (!isOwner) return null;

  const updatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const normalizedTitle = title.trim();
    const normalizedTopic = topic.trim().replace(/^#+/, '');
    const nextContent = post.contentFormat === 'RICH_HTML' ? richEditorRef.current?.innerHTML.trim() ?? '' : content.trim();
    if (normalizedTitle.length < 2 || normalizedTopic.length < 1 || nextContent.length < 2) {
      setMessage(t('태그, 제목, 본문을 입력해주세요.', 'Enter a tag, title, and content.'));
      return;
    }
    setPending(true);
    setMessage('');
    try {
      if (!(await loadSupabaseBrowserConfig())) throw new Error('Supabase is not configured');
      const { error } = await supabase.from('posts').update({ title: normalizedTitle, topic: normalizedTopic, content: nextContent }).eq('id', post.id).eq('author_id', user!.uid);
      if (error) throw error;
      setEditing(false);
      setMenuOpen(false);
      router.refresh();
    } catch {
      setMessage(t('게시글을 수정하지 못했습니다.', 'Could not update the post.'));
    } finally {
      setPending(false);
    }
  };

  const deletePost = async () => {
    if (pending || !window.confirm(t('이 게시글을 삭제할까요? 삭제 후 복구할 수 없습니다.', 'Delete this post? This cannot be undone.'))) return;
    setPending(true);
    setMessage('');
    try {
      if (!(await loadSupabaseBrowserConfig())) throw new Error('Supabase is not configured');

      const { data: imageRows, error: imageQueryError } = await supabase
        .from('post_images')
        .select('storage_path, image_url')
        .eq('post_id', post.id);
      if (imageQueryError) throw imageQueryError;

      const paths = new Set<string>();
      for (const image of imageRows ?? []) {
        if (image.storage_path) paths.add(image.storage_path);
        else if (image.image_url) {
          const path = storagePath(image.image_url);
          if (path) paths.add(path);
        }
      }
      for (const imageUrl of post.imageUrls) {
        const path = storagePath(imageUrl);
        if (path) paths.add(path);
      }

      if (paths.size) {
        const { error: storageError } = await supabase.storage
          .from('community-images')
          .remove([...paths]);
        if (storageError) throw storageError;
      }

      const { data: deletedPost, error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('author_id', user!.uid)
        .select('id')
        .maybeSingle();
      if (deleteError) throw deleteError;
      if (!deletedPost) throw new Error('게시글 삭제 권한이 없거나 이미 삭제된 게시글입니다.');

      router.replace('/community');
      router.refresh();
    } catch (error) {
      console.error('게시글 완전 삭제 실패:', error);
      setMessage(t('게시글을 삭제하지 못했습니다.', 'Could not delete the post.'));
      setPending(false);
    }
  };

  return (
    <div className="relative ml-auto">
      <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-full p-2 text-[#817873] hover:bg-[#f5f2ef]" aria-label={t('게시글 메뉴', 'Post menu')}><FaEllipsis /></button>
      {menuOpen && <div className="absolute right-0 top-10 z-20 min-w-28 overflow-hidden rounded-xl border border-[#eadfd7] bg-white py-1 text-sm font-bold shadow-lg">
        <button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }} className="block w-full px-4 py-2 text-left hover:bg-[#f5f2ef]">{t('수정', 'Edit')}</button>
        <button type="button" disabled={pending} onClick={() => void deletePost()} className="block w-full px-4 py-2 text-left text-alert hover:bg-[#fff2f2]">{t('삭제', 'Delete')}</button>
      </div>}
      {message && !editing && <p className="absolute right-0 top-11 z-20 w-56 rounded-xl bg-white p-3 text-xs font-semibold text-alert shadow-lg">{message}</p>}

      {editing && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 sm:items-center sm:p-5">
        <form onSubmit={updatePost} className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="community-editor-title">
          <h2 id="community-editor-title" className="sr-only">{t('게시글 수정', 'Edit post')}</h2>
          <span className="pointer-events-none absolute bottom-6 left-[35px] top-[60px] w-0.5 rounded-full bg-[#ddd6d1] sm:bottom-8 sm:left-[43px] sm:top-[68px]" aria-hidden />
          <button type="button" disabled={pending} onClick={() => setEditing(false)} className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#817873] hover:bg-[#f5f2ef]" aria-label={t('닫기', 'Close')}><FaXmark /></button>
          <div className="flex items-start gap-3 pr-10 sm:gap-4">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary1">
              {user?.photoURL ? <Image src={user.photoURL} alt="" fill sizes="40px" className="object-cover" /> : userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-h-10 min-w-0 items-center gap-2 text-sm sm:text-base">
                <strong className="max-w-[42%] truncate font-extrabold text-[#332d2a]">{userName}</strong>
                <FaChevronRight className="shrink-0 text-xs text-[#b1a8a2]" aria-hidden />
                <input value={topic} onChange={(event) => setTopic(event.target.value.replace(/[\s#]/g, '').slice(0, 20))} maxLength={20} placeholder={t('커뮤니티 또는 주제', 'Community or topic')} className="min-w-0 flex-1 bg-transparent font-medium text-[#332d2a] outline-none placeholder:text-[#9a918b]" aria-label={t('글 주제', 'Post topic')} />
              </div>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder={t('새로운 소식이 있나요?', "What's new?")} className="mt-1 w-full bg-transparent text-base font-medium text-[#332d2a] outline-none placeholder:text-[#9a918b] sm:text-lg" aria-label={t('글 제목', 'Post title')} />
            </div>
          </div>
          {post.contentFormat === 'RICH_HTML' ? <div ref={richEditorRef} contentEditable suppressContentEditableWarning className="ml-[52px] -mt-2 min-h-12 bg-transparent text-sm leading-6 text-[#332d2a] outline-none sm:ml-[56px] [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl" dangerouslySetInnerHTML={{ __html: post.safeHtml ?? '' }} /> : <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} maxLength={5000} className="ml-[52px] -mt-2 min-h-12 resize-y bg-transparent text-sm leading-6 text-[#332d2a] outline-none sm:ml-[56px]" aria-label={t('글 내용', 'Post content')} />}
          {message && <p className="ml-[52px] text-xs font-semibold text-alert sm:ml-[56px]">{message}</p>}
          <div className="ml-[52px] mt-1 flex justify-end gap-2 pt-2 sm:ml-[56px]"><button type="button" onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-sm font-bold text-[#817873] hover:bg-[#f5f2ef]">{t('취소', 'Cancel')}</button><button type="submit" disabled={pending} className="rounded-full bg-primary1 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? t('저장 중...', 'Saving...') : t('저장', 'Save')}</button></div>
        </form>
      </div>}
    </div>
  );
}
