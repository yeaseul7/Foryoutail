'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { FaCheck, FaGear, FaHeart, FaPen, FaRegComment, FaRegHeart, FaTableCellsLarge, FaXmark } from 'react-icons/fa6';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLanguage } from '@/lib/i18n/language';
import { useAuth } from '@/lib/supabase/auth';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';
import PageFooter from '@/packages/components/base/PageFooter';
import Loading from '@/packages/components/base/Loading';
import PageTemplate from '@/packages/components/base/PageTemplate';
import LikedAnimalList from '@/packages/components/shelter/LikedAnimalList';

type ProfilePost = {
  id: string;
  slug: string;
  title: string;
  main_image_url: string | null;
  likes_count: number | null;
  comment_count: number | null;
};

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

async function makeProfileImage(file: File): Promise<Blob> {
  const image = document.createElement('img');
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image decode failed'));
      image.src = objectUrl;
    });
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed')), 'image/jpeg', 0.82));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function profileStoragePath(url: string | null, userId: string): string | null {
  if (!url) return null;
  const marker = '/storage/v1/object/public/community-images/';
  try {
    const pathname = new URL(url).pathname;
    const index = pathname.indexOf(marker);
    if (index < 0) return null;
    const path = decodeURIComponent(pathname.slice(index + marker.length));
    return path.startsWith(`${userId}/profile/`) ? path : null;
  } catch {
    return null;
  }
}

export default function MyPage() {
  const router = useRouter();
  const { user, loading, logout, updateUserProfile } = useAuth();
  const { photoURL, nickname } = useUserProfile();
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'posts' | 'likes'>('posts');
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [namePending, setNamePending] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null);
  const [photoPending, setPhotoPending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      setPostsLoading(true);
      setPostsError(false);
      try {
        if (!(await loadSupabaseBrowserConfig())) return;
        const { data, error } = await supabase
          .from('posts')
          .select('id, slug, title, main_image_url, likes_count, comment_count')
          .eq('author_id', user.uid)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (active) setPosts((data ?? []) as ProfilePost[]);
      } catch (error) {
        console.error('내 게시글 조회 실패:', error);
        if (active) setPostsError(true);
      } finally {
        if (active) setPostsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const saveNickname = async () => {
    const normalizedName = nameDraft.trim();
    if (namePending || normalizedName.length < 2 || normalizedName.length > 30) {
      if (!namePending) window.alert(t('닉네임은 2~30자로 입력해주세요.', 'Enter a nickname between 2 and 30 characters.'));
      return;
    }
    setNamePending(true);
    try {
      await updateUserProfile({ displayName: normalizedName });
      setSavedName(normalizedName);
      setEditingName(false);
    } catch {
      window.alert(t('닉네임을 수정하지 못했습니다.', 'Could not update your nickname.'));
    } finally {
      setNamePending(false);
    }
  };

  const updateProfilePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || photoPending || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      window.alert(t('JPG, PNG, WebP 이미지만 사용할 수 있습니다.', 'Only JPG, PNG, and WebP images are supported.'));
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      window.alert(t('프로필 사진은 5MB 이하여야 합니다.', 'Profile images must be 5 MB or smaller.'));
      return;
    }

    setPhotoPending(true);
    let uploadedPath: string | null = null;
    try {
      if (!(await loadSupabaseBrowserConfig())) throw new Error('Supabase is not configured');
      const profileImage = await makeProfileImage(file);
      uploadedPath = `${user.uid}/profile/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('community-images').upload(uploadedPath, profileImage, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;
      const nextPhotoUrl = supabase.storage.from('community-images').getPublicUrl(uploadedPath).data.publicUrl;
      await updateUserProfile({ photoURL: nextPhotoUrl });
      const oldPath = profileStoragePath(savedPhoto || photoURL, user.uid);
      setSavedPhoto(nextPhotoUrl);
      if (oldPath && oldPath !== uploadedPath) await supabase.storage.from('community-images').remove([oldPath]);
    } catch (error) {
      console.error('프로필 사진 수정 실패:', error);
      if (uploadedPath) await supabase.storage.from('community-images').remove([uploadedPath]);
      window.alert(t('프로필 사진을 수정하지 못했습니다.', 'Could not update your profile image.'));
    } finally {
      setPhotoPending(false);
    }
  };

  const deleteAccount = async () => {
    if (deleting || !window.confirm(t('계정을 탈퇴할까요? 이 작업은 복구할 수 없습니다.', 'Delete your account? This cannot be undone.'))) return;
    setDeleting(true);
    try {
      if (!(await loadSupabaseBrowserConfig())) throw new Error('Supabase is not configured');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Account deletion failed');
      await supabase.auth.signOut();
      router.replace('/');
      router.refresh();
    } catch {
      window.alert(t('회원 탈퇴에 실패했습니다.', 'Could not delete your account.'));
      setDeleting(false);
    }
  };

  if (loading || !user) return <main className="page-container-full"><PageTemplate><Loading /></PageTemplate></main>;

  const displayName = savedName || nickname || user.displayName || user.email?.split('@')[0] || t('사용자', 'User');
  const displayPhoto = savedPhoto || photoURL;

  return (
    <main className="page-container-full">
      <PageTemplate>
        <section className="mx-auto w-full max-w-5xl flex-1 px-1 pb-10 pt-5 sm:px-4 sm:pt-8">
          <div className="relative flex items-center gap-5 px-4 pb-6 sm:gap-8 sm:px-8">
            <button type="button" disabled={photoPending} onClick={() => profileInputRef.current?.click()} className="group relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-extrabold text-primary1 disabled:cursor-wait sm:h-28 sm:w-28" aria-label={t('프로필 사진 수정', 'Edit profile image')}>
              <span className="absolute inset-0 overflow-hidden rounded-full">
                {displayPhoto ? <Image src={displayPhoto} alt="" fill sizes="112px" className={`object-cover transition ${photoPending ? 'opacity-50' : 'group-hover:brightness-90'}`} /> : displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="absolute bottom-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#332d2a] text-[11px] text-white shadow-sm sm:h-8 sm:w-8" aria-hidden><FaPen /></span>
              {photoPending && <span className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/30 text-xs font-bold text-white">{t('저장 중', 'Saving')}</span>}
            </button>
            <input ref={profileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void updateProfilePhoto(event)} className="sr-only" />
            <div className="min-w-0 flex-1">
              {editingName ? <div className="flex max-w-sm items-center gap-1.5">
                <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value.slice(0, 30))} onKeyDown={(event) => { if (event.key === 'Enter') void saveNickname(); if (event.key === 'Escape') setEditingName(false); }} maxLength={30} autoFocus aria-label={t('닉네임', 'Nickname')} className="min-w-0 flex-1 border-b border-primary1 bg-transparent py-1 text-xl font-extrabold text-[#332d2a] outline-none sm:text-2xl" />
                <button type="button" disabled={namePending} onClick={() => void saveNickname()} className="rounded-full p-2 text-primary1 hover:bg-primary-soft disabled:opacity-50" aria-label={t('저장', 'Save')}><FaCheck aria-hidden /></button>
                <button type="button" disabled={namePending} onClick={() => setEditingName(false)} className="rounded-full p-2 text-[#817873] hover:bg-[#f5f2ef]" aria-label={t('취소', 'Cancel')}><FaXmark aria-hidden /></button>
              </div> : <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-xl font-extrabold text-[#332d2a] sm:text-2xl">{displayName}</h1>
                <button type="button" onClick={() => { setNameDraft(displayName); setEditingName(true); }} className="shrink-0 rounded-full p-2 text-sm text-[#817873] transition hover:bg-[#f5f2ef] hover:text-primary1" aria-label={t('닉네임 수정', 'Edit nickname')}><FaPen aria-hidden /></button>
              </div>}
              <p className="mt-1 truncate text-sm text-[#817873]">{user.email}</p>
              <p className="mt-3 text-sm font-semibold text-[#5f5752]">{t(`게시글 ${posts.length}`, `${posts.length} posts`)}</p>
            </div>
            <div ref={menuRef} className="absolute right-3 top-0 sm:right-8">
              <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-full p-2.5 text-xl text-[#5f5752] transition hover:bg-[#f5f2ef]" aria-label={t('계정 설정', 'Account settings')}><FaGear aria-hidden /></button>
              {menuOpen && <div className="absolute right-0 top-12 z-20 w-36 overflow-hidden rounded-xl border border-[#eadfd7] bg-white py-1 text-sm font-bold shadow-xl">
                <button type="button" onClick={() => void handleLogout()} className="block w-full px-4 py-2.5 text-left text-[#332d2a] hover:bg-[#f5f2ef]">{t('로그아웃', 'Log out')}</button>
                <button type="button" disabled={deleting} onClick={() => void deleteAccount()} className="block w-full px-4 py-2.5 text-left text-alert hover:bg-[#fff2f2] disabled:opacity-50">{deleting ? t('탈퇴 중...', 'Deleting...') : t('회원 탈퇴', 'Delete account')}</button>
              </div>}
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-[#eadfd7]">
            <button type="button" onClick={() => setTab('posts')} className={`flex items-center justify-center gap-2 border-t-2 py-4 text-sm font-bold ${tab === 'posts' ? '-mt-px border-[#332d2a] text-[#332d2a]' : '-mt-px border-transparent text-[#9a918b]'}`}><FaTableCellsLarge aria-hidden />{t('게시글', 'Posts')}</button>
            <button type="button" onClick={() => setTab('likes')} className={`flex items-center justify-center gap-2 border-t-2 py-4 text-sm font-bold ${tab === 'likes' ? '-mt-px border-[#332d2a] text-[#332d2a]' : '-mt-px border-transparent text-[#9a918b]'}`}><FaHeart aria-hidden />{t('찜한 동물', 'Saved animals')}</button>
          </div>

          {tab === 'posts' && (postsLoading ? <Loading /> : postsError ? <p className="py-16 text-center text-sm text-alert">{t('게시글을 불러오지 못했습니다.', 'Could not load posts.')}</p> : posts.length === 0 ? <p className="py-16 text-center text-sm text-[#817873]">{t('작성한 게시글이 없습니다.', 'No posts yet.')}</p> : <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-2">
            {posts.map((post) => <Link key={post.id} href={`/community/${post.slug}`} className="group relative aspect-square overflow-hidden bg-[#f5f2ef]">
              {post.main_image_url ? <Image src={post.main_image_url} alt="" fill sizes="(max-width: 640px) 50vw, 320px" className="object-cover transition duration-200 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center p-4 text-center text-sm font-bold text-[#817873]">{post.title}</div>}
              <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-3 pt-10 ${post.main_image_url ? 'bg-gradient-to-t from-black/75 to-transparent text-white' : 'text-[#5f5752]'}`}>
                {post.main_image_url && <span className="min-w-0 truncate text-sm font-bold">{post.title}</span>}
                <span className="ml-auto flex shrink-0 items-center gap-3 text-xs font-bold">
                  <span className="inline-flex items-center gap-1"><FaRegHeart aria-hidden />{post.likes_count ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><FaRegComment aria-hidden />{post.comment_count ?? 0}</span>
                </span>
              </div>
            </Link>)}
          </div>)}
          {tab === 'likes' && <LikedAnimalList userId={user.uid} />}
        </section>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
