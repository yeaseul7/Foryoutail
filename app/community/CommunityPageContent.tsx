'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ChangeEvent, type FormEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronRight, FaHeart, FaImage, FaMagnifyingGlass, FaRegComment, FaRegHeart, FaShare, FaXmark } from 'react-icons/fa6';
import { useLanguage } from '@/lib/i18n/language';
import type { CommunityFeedPage, CommunityFeedPost, CommunitySort } from '@/lib/server/community-posts';
import { useAuth } from '@/lib/supabase/auth';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';
import { formatCommunityPostDate } from '@/packages/utils/communityDate';

function CommunityCard({ post }: { post: CommunityFeedPost }) {
  const { isEnglish, t } = useLanguage();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [likePending, setLikePending] = useState(false);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [sharePending, setSharePending] = useState(false);
  const [copied, setCopied] = useState(false);
  const date = formatCommunityPostDate(post.createdAt, isEnglish ? 'en-US' : 'ko-KR');
  const authorName = post.authorName || t('익명', 'Anonymous');

  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }
    let active = true;
    void (async () => {
      if (!(await loadSupabaseBrowserConfig())) return;
      const { data } = await supabase.from('post_likes').select('post_id').eq('post_id', post.id).eq('user_id', user.uid).maybeSingle();
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
    const url = `${window.location.origin}/community/${post.slug}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = url; textarea.style.position = 'fixed'; textarea.style.opacity = '0';
        document.body.append(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
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
    <article className="overflow-hidden rounded-3xl border border-[#eadfd7] bg-white shadow-[0_5px_18px_rgba(51,45,42,0.07)]">
      <Link href={`/community/${post.slug}`} className="block transition hover:bg-[#fffdfb]" aria-label={post.title}>
      <div className="px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[10px] font-extrabold text-primary1">
            {post.authorImageUrl ? (
              <Image src={post.authorImageUrl} alt="" fill sizes="28px" className="object-cover" />
            ) : authorName.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-xs">
            <span className="truncate font-bold text-[#332d2a]">{authorName}</span>
            {post.topic && (
              <>
                <FaChevronRight className="shrink-0 text-[9px] text-[#b1a8a2]" aria-hidden />
                <span className="max-w-[40%] truncate font-bold text-primary1">{post.topic}</span>
              </>
            )}
            <span className="shrink-0 text-[#9a918b]" aria-hidden>·</span>
            <time dateTime={post.createdAt} className="shrink-0 text-[#9a918b]">{date}</time>
          </div>
        </div>
        <h2 className="mt-1 text-base font-bold leading-6 text-[#332d2a] sm:text-lg">{post.title}</h2>
      </div>
      {post.imageUrl && (
        <div className="relative mx-auto aspect-[16/10] w-full max-w-2xl overflow-hidden bg-[#f5f2ef]">
          <Image src={post.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="scale-110 object-cover blur-2xl" aria-hidden />
          <div className="absolute inset-0 bg-black/15" aria-hidden />
          <Image src={post.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="z-10 object-contain" />
        </div>
      )}
      </Link>
      <div className="mx-5 flex items-center gap-5 py-4 text-xs font-semibold text-[#817873] sm:mx-7">
        <button type="button" onClick={() => void toggleLike()} disabled={likePending} aria-pressed={liked} className={`inline-flex items-center gap-1.5 transition disabled:opacity-60 ${liked ? 'text-[#e75d68]' : 'hover:text-[#e75d68]'}`}>{liked ? <FaHeart className="text-xl" aria-hidden /> : <FaRegHeart className="text-xl" aria-hidden />}{likesCount}</button>
        <Link href={`/community/${post.slug}#comments`} className="inline-flex items-center gap-1.5 transition hover:text-[#332d2a]"><FaRegComment className="text-xl" aria-hidden />{post.commentCount}</Link>
        <button type="button" onClick={() => void sharePost()} disabled={sharePending} className="inline-flex items-center gap-1.5 transition hover:text-primary1 disabled:opacity-50" aria-label={t('게시물 링크 복사', 'Copy post link')}><FaShare className="text-xl" aria-hidden />{copied ? t('복사됨', 'Copied') : shareCount}</button>
      </div>
    </article>
  );
}

type ComposerImage = {
  id: string;
  file: File;
  preview: string;
};

type CropRect = { x: number; y: number; width: number; height: number };
type ImageLayout = { left: number; top: number; width: number; height: number; naturalWidth: number; naturalHeight: number };

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_EDGE = 960;
const UPLOAD_JPEG_QUALITY = 0.72;
const CROP_RATIOS = [
  { label: '원본', englishLabel: 'Original', value: 0 },
  { label: '1:1', englishLabel: '1:1', value: 1 },
  { label: '4:3', englishLabel: '4:3', value: 4 / 3 },
  { label: '3:4', englishLabel: '3:4', value: 3 / 4 },
  { label: '16:9', englishLabel: '16:9', value: 16 / 9 },
];

function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unsupported image')); };
    image.src = url;
  });
}

async function optimizeImageFile(file: File): Promise<File> {
  const image = await loadBrowserImage(file);
  const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', UPLOAD_JPEG_QUALITY));
  if (!blob) throw new Error('Image processing failed');
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
}

function ImageEditor({ item, onCancel, onApply }: { item: ComposerImage; onCancel: () => void; onApply: (file: File) => void }) {
  const { isEnglish, t } = useLanguage();
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; start: CropRect; handle: string | null } | null>(null);
  const [ratio, setRatio] = useState(0);
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [saving, setSaving] = useState(false);

  const layoutCrop = useCallback((requestedRatio = ratio) => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image?.naturalWidth || !image.naturalHeight) return;
    const scale = Math.min(stage.clientWidth / image.naturalWidth, stage.clientHeight / image.naturalHeight);
    const nextLayout = {
      width: image.naturalWidth * scale,
      height: image.naturalHeight * scale,
      left: (stage.clientWidth - image.naturalWidth * scale) / 2,
      top: (stage.clientHeight - image.naturalHeight * scale) / 2,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
    const cropRatio = requestedRatio || image.naturalWidth / image.naturalHeight;
    const width = nextLayout.width / nextLayout.height >= cropRatio ? nextLayout.height * cropRatio : nextLayout.width;
    const height = width / cropRatio;
    setLayout(nextLayout);
    setCrop({ x: nextLayout.left + (nextLayout.width - width) / 2, y: nextLayout.top + (nextLayout.height - height) / 2, width, height });
  }, [ratio]);

  useEffect(() => {
    const resize = () => layoutCrop();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [layoutCrop]);

  const moveCrop = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !layout) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const cropRatio = ratio || layout.naturalWidth / layout.naturalHeight;
    if (!drag.handle) {
      setCrop({ ...drag.start, x: Math.min(layout.left + layout.width - drag.start.width, Math.max(layout.left, drag.start.x + dx)), y: Math.min(layout.top + layout.height - drag.start.height, Math.max(layout.top, drag.start.y + dy)) });
      return;
    }
    const left = drag.handle.endsWith('left');
    const top = drag.handle.startsWith('top');
    const anchorX = left ? drag.start.x + drag.start.width : drag.start.x;
    const anchorY = top ? drag.start.y + drag.start.height : drag.start.y;
    const widthFromX = left ? drag.start.width - dx : drag.start.width + dx;
    const widthFromY = (top ? drag.start.height - dy : drag.start.height + dy) * cropRatio;
    const maxWidthX = left ? anchorX - layout.left : layout.left + layout.width - anchorX;
    const maxWidthY = (top ? anchorY - layout.top : layout.top + layout.height - anchorY) * cropRatio;
    const width = Math.min(maxWidthX, maxWidthY, Math.max(48, Math.abs(dx) >= Math.abs(dy) ? widthFromX : widthFromY));
    const height = width / cropRatio;
    setCrop({ x: left ? anchorX - width : anchorX, y: top ? anchorY - height : anchorY, width, height });
  };

  const apply = async () => {
    const image = imageRef.current;
    if (!image || !layout || !crop.width) return;
    setSaving(true);
    try {
      const cropRatio = ratio || layout.naturalWidth / layout.naturalHeight;
      const sourceX = (crop.x - layout.left) / layout.width * layout.naturalWidth;
      const sourceY = (crop.y - layout.top) / layout.height * layout.naturalHeight;
      const sourceWidth = crop.width / layout.width * layout.naturalWidth;
      const sourceHeight = crop.height / layout.height * layout.naturalHeight;
      const canvas = document.createElement('canvas');
      if (cropRatio >= 1) { canvas.width = MAX_UPLOAD_EDGE; canvas.height = Math.round(MAX_UPLOAD_EDGE / cropRatio); }
      else { canvas.height = MAX_UPLOAD_EDGE; canvas.width = Math.round(MAX_UPLOAD_EDGE * cropRatio); }
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable');
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', UPLOAD_JPEG_QUALITY));
      if (!blob) throw new Error('Image processing failed');
      onApply(new File([blob], item.file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={t('사진 편집', 'Edit photo')}>
      <div className="w-full max-w-[680px] rounded-t-3xl bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#332d2a]">{t('사진 자르기 및 편집', 'Crop and edit photo')}</h3>
          <button type="button" onClick={onCancel} className="rounded-full p-2 hover:bg-[#f5f2ef]" aria-label={t('닫기', 'Close')}><FaXmark /></button>
        </div>
        <div ref={stageRef} className="relative h-[min(52vh,480px)] w-full touch-none overflow-hidden bg-[#252925]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={item.preview} alt={t('자를 사진', 'Photo to crop')} draggable={false} onLoad={() => layoutCrop()} className="absolute block max-w-none select-none" style={layout ? { left: layout.left, top: layout.top, width: layout.width, height: layout.height } : undefined} />
          {layout && <div
            className="absolute z-10 touch-none cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(16,19,17,0.58)]"
            style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height, background: 'linear-gradient(90deg,transparent 33.1%,rgba(255,255,255,.62) 33.3% 33.7%,transparent 33.9% 66.1%,rgba(255,255,255,.62) 66.3% 66.7%,transparent 66.9%),linear-gradient(transparent 33.1%,rgba(255,255,255,.62) 33.3% 33.7%,transparent 33.9% 66.1%,rgba(255,255,255,.62) 66.3% 66.7%,transparent 66.9%)' }}
            onPointerDown={(event) => { event.preventDefault(); const handle = (event.target as HTMLElement).dataset.cropHandle ?? null; dragRef.current = { startX: event.clientX, startY: event.clientY, start: crop, handle }; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={moveCrop}
            onPointerUp={() => { dragRef.current = null; }}
            onPointerCancel={() => { dragRef.current = null; }}
          >
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => <span key={position} data-crop-handle={position} className={`absolute h-3.5 w-3.5 border-[3px] border-white bg-primary1 ${position === 'top-left' ? '-left-2 -top-2 cursor-nwse-resize' : position === 'top-right' ? '-right-2 -top-2 cursor-nesw-resize' : position === 'bottom-left' ? '-bottom-2 -left-2 cursor-nesw-resize' : '-bottom-2 -right-2 cursor-nwse-resize'}`} />)}
          </div>}
        </div>
        <div className="mt-4 flex justify-center gap-1.5 overflow-x-auto">
          {CROP_RATIOS.map((option) => <button key={option.label} type="button" onClick={() => { setRatio(option.value); layoutCrop(option.value); }} className={`h-9 min-w-12 rounded-lg border px-2.5 text-[11px] font-extrabold ${ratio === option.value ? 'border-primary1 bg-primary-soft text-primary1' : 'border-[#dfe5e1] text-[#69716b]'}`}>{isEnglish && option.englishLabel ? option.englishLabel : option.label}</button>)}
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-[#dfe5e1] px-4 py-2 text-sm font-bold text-[#817873]">{t('취소', 'Cancel')}</button><button type="button" disabled={saving} onClick={() => void apply()} className="rounded-lg bg-primary1 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? t('적용 중...', 'Applying...') : t('자르기 완료', 'Crop photo')}</button></div>
      </div>
    </div>
  );
}

function CommunityComposer({ onCreated }: { onCreated: (post: CommunityFeedPost) => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [topicSuggestionsOpen, setTopicSuggestionsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<ComposerImage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentEditorRef = useRef<HTMLDivElement>(null);
  const contentSelectionRef = useRef<Range | null>(null);
  const userName = user?.displayName || user?.email?.split('@')[0] || t('사용자', 'User');

  const openComposer = () => {
    if (!user) {
      setMessage(t('로그인 후 글을 작성할 수 있어요.', 'Log in to create a post.'));
      return;
    }
    setMessage('');
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !editingId && !submitting) setOpen(false); };
    document.addEventListener('keydown', close);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = previous; };
  }, [editingId, open, submitting]);

  useEffect(() => {
    const query = topic.trim();
    if (!open || !query) {
      setTopicSuggestions([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!(await loadSupabaseBrowserConfig())) return;
        const { data } = await supabase.from('posts').select('topic').ilike('topic', `%${query}%`).not('topic', 'is', null).limit(20);
        if (!active) return;
        const unique = [...new Set((data ?? []).map((row) => row.topic?.trim()).filter((value): value is string => Boolean(value)))].slice(0, 8);
        setTopicSuggestions(unique);
        setTopicSuggestionsOpen(unique.length > 0);
      })();
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, topic]);

  const rememberContentSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && contentEditorRef.current?.contains(selection.getRangeAt(0).commonAncestorContainer)) contentSelectionRef.current = selection.getRangeAt(0).cloneRange();
  };

  const selectImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const available = MAX_IMAGES - images.length;
    const requested = Array.from(event.target.files ?? []);
    const selected = requested.slice(0, available);
    event.target.value = '';
    if (requested.length > available) setMessage(t('사진은 최대 5장까지 등록할 수 있어요.', 'You can add up to 5 photos.'));
    const valid = selected.filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES);
    if (valid.length !== selected.length) setMessage(t('사진은 장당 8MB 이하의 이미지 파일만 등록할 수 있어요.', 'Each photo must be an image up to 8 MB.'));
    const optimized: File[] = [];
    for (const file of valid) {
      try { optimized.push(await optimizeImageFile(file)); }
      catch { setMessage(t('브라우저에서 처리할 수 없는 사진은 제외했어요. JPEG, PNG 또는 WebP로 변환해주세요.', 'Some photos could not be processed. Convert them to JPEG, PNG, or WebP.')); }
    }
    const editor = contentEditorRef.current;
    const additions = optimized.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    setImages((current) => [...current, ...additions]);
    if (editor && additions.length) {
      const range = contentSelectionRef.current && editor.contains(contentSelectionRef.current.commonAncestorContainer) ? contentSelectionRef.current : document.createRange();
      if (!contentSelectionRef.current || !editor.contains(range.commonAncestorContainer)) { range.selectNodeContents(editor); range.collapse(false); }
      for (const item of additions) {
        const figure = document.createElement('figure');
        figure.contentEditable = 'false';
        figure.dataset.attachmentId = item.id;
        figure.className = 'group relative my-3 w-full max-w-sm overflow-hidden rounded-2xl bg-[#f5f2ef]';
        const image = document.createElement('img');
        image.src = item.preview;
        image.alt = t('본문 이미지', 'Post image');
        image.dataset.attachmentId = item.id;
        image.className = 'block h-auto max-h-[480px] w-full object-contain';
        const tools = document.createElement('div');
        tools.className = 'absolute right-2 top-2 flex gap-1';
        const cropButton = document.createElement('button');
        cropButton.type = 'button'; cropButton.dataset.imageAction = 'crop'; cropButton.dataset.imageId = item.id; cropButton.textContent = t('자르기', 'Crop'); cropButton.className = 'rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary1 shadow';
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button'; deleteButton.dataset.imageAction = 'delete'; deleteButton.dataset.imageId = item.id; deleteButton.textContent = t('삭제', 'Delete'); deleteButton.className = 'rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-alert shadow';
        tools.append(cropButton, deleteButton);
        figure.append(image, tools);
        range.insertNode(figure);
        range.setStartAfter(figure);
        range.collapse(true);
      }
      const paragraph = document.createElement('p');
      paragraph.append(document.createElement('br'));
      range.insertNode(paragraph);
      range.setStart(paragraph, 0);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges(); selection?.addRange(range);
      contentSelectionRef.current = range.cloneRange();
    }
  };

  const removeImage = (id: string) => setImages((current) => {
    const target = current.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    return current.filter((image) => image.id !== id);
  });

  const handleContentClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-image-action]');
    if (!button) return;
    const id = button.dataset.imageId;
    if (!id) return;
    if (button.dataset.imageAction === 'crop') setEditingId(id);
    else { button.closest('figure')?.remove(); removeImage(id); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || submitting) return;
    const normalizedTitle = title.trim();
    const normalizedTopic = topic.trim().replace(/^#+/, '');
    const editor = contentEditorRef.current;
    if (!editor) return;
    const editorCopy = editor.cloneNode(true) as HTMLDivElement;
    const hasImage = Boolean(editorCopy.querySelector('img[data-attachment-id]'));
    if (normalizedTopic.length < 1 || normalizedTitle.length < 2 || ((editorCopy.textContent?.trim().length ?? 0) < 2 && !hasImage)) {
      setMessage(t('태그를 입력하고 제목과 내용을 2자 이상 작성해주세요.', 'Add a tag and enter at least 2 characters for the title and post.'));
      return;
    }

    setSubmitting(true);
    setMessage('');
    const uploadedPaths: string[] = [];
    let createdPostId: string | null = null;
    try {
      const configured = await loadSupabaseBrowserConfig();
      if (!configured) throw new Error('Supabase is not configured');
      const imageUrls: string[] = [];
      for (const image of images) {
        const extension = image.file.type === 'image/png' ? 'png' : 'jpg';
        const path = `${user.uid}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('community-images').upload(path, image.file, { contentType: image.file.type, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        imageUrls.push(supabase.storage.from('community-images').getPublicUrl(path).data.publicUrl);
      }
      const imageUrlById = new Map(images.map((image, index) => [image.id, imageUrls[index]]));
      editorCopy.querySelectorAll<HTMLImageElement>('img[data-attachment-id]').forEach((image) => {
        const url = imageUrlById.get(image.dataset.attachmentId ?? '');
        if (url) image.src = url;
        image.removeAttribute('data-attachment-id');
        image.removeAttribute('class');
      });
      editorCopy.querySelectorAll('button, figure > div').forEach((element) => element.remove());
      editorCopy.querySelectorAll('figure').forEach((figure) => { figure.removeAttribute('contenteditable'); figure.removeAttribute('data-attachment-id'); figure.removeAttribute('class'); });
      const normalizedContent = editorCopy.innerHTML.trim();
      const { data, error } = await supabase
        .from('posts')
        .insert({ author_id: user.uid, title: normalizedTitle, topic: normalizedTopic, content: normalizedContent, content_format: 'RICH_HTML', main_image_url: imageUrls[0] ?? null })
        .select('id, slug, title, topic, content, main_image_url, likes_count, comment_count, share_count, created_at')
        .single();
      if (error) throw error;
      createdPostId = data.id;
      if (imageUrls.length) {
        const { error: imageError } = await supabase.from('post_images').insert(imageUrls.map((imageUrl, sortOrder) => ({
          post_id: data.id,
          storage_path: uploadedPaths[sortOrder],
          image_url: imageUrl,
          sort_order: sortOrder,
        })));
        if (imageError) throw imageError;
      }

      onCreated({
        id: data.id,
        slug: data.slug,
        title: data.title,
        topic: data.topic,
        excerpt: data.content,
        imageUrl: data.main_image_url,
        authorName: user.displayName,
        authorImageUrl: user.photoURL,
        likesCount: data.likes_count ?? 0,
        commentCount: data.comment_count ?? 0,
        shareCount: data.share_count ?? 0,
        createdAt: data.created_at,
      });
      setTitle('');
      setTopic('');
      editor.innerHTML = '';
      contentSelectionRef.current = null;
      images.forEach((image) => URL.revokeObjectURL(image.preview));
      setImages([]);
      setOpen(false);
    } catch (error) {
      console.error('게시글 등록 실패:', error);
      if (createdPostId) await supabase.from('posts').delete().eq('id', createdPostId);
      if (uploadedPaths.length) await supabase.storage.from('community-images').remove(uploadedPaths);
      setMessage(t('글을 등록하지 못했어요. 잠시 후 다시 시도해주세요.', 'Could not publish the post. Try again shortly.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-2 rounded-3xl border border-[#eadfd7] bg-white p-2 shadow-[0_5px_18px_rgba(51,45,42,0.07)] sm:mb-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary1">
          {user?.photoURL ? <Image src={user.photoURL} alt="" fill sizes="32px" className="object-cover" /> : userName.slice(0, 1).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={openComposer}
          className="min-h-11 flex-1 rounded-full bg-[#f5f2ef] px-3 text-left text-sm text-[#817873] transition hover:bg-[#eee8e3] sm:px-4"
        >
          {t(`${userName}님, 무슨 이야기를 나누고 싶으세요?`, `What's on your mind, ${userName}?`)}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target && !submitting) setOpen(false); }}>
        <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="community-composer-title" className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-t-3xl bg-white p-4 sm:rounded-3xl sm:p-6">
          <h2 id="community-composer-title" className="sr-only">{t('글 작성', 'Create post')}</h2>
          <span className="pointer-events-none absolute bottom-6 left-[35px] top-[60px] w-0.5 rounded-full bg-[#ddd6d1] sm:bottom-8 sm:left-[43px] sm:top-[68px]" aria-hidden />
          <button type="button" disabled={submitting} onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#817873] hover:bg-[#f5f2ef]" aria-label={t('닫기', 'Close')}><FaXmark /></button>
          <div className="flex items-start gap-3 pr-10 sm:gap-4">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary1">
              {user?.photoURL ? <Image src={user.photoURL} alt="" fill sizes="40px" className="object-cover" /> : userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-h-10 min-w-0 items-center gap-2 text-sm sm:text-base">
                <strong className="max-w-[42%] truncate font-extrabold text-[#332d2a]">{userName}</strong>
                <FaChevronRight className="shrink-0 text-xs text-[#b1a8a2]" aria-hidden />
                <div className="relative min-w-0 flex-1">
                  <input value={topic} onFocus={() => setTopicSuggestionsOpen(topicSuggestions.length > 0)} onBlur={() => window.setTimeout(() => setTopicSuggestionsOpen(false), 120)} onChange={(event) => { setTopic(event.target.value.replace(/[\s#]/g, '').slice(0, 20)); setTopicSuggestionsOpen(true); }} maxLength={20} placeholder={t('커뮤니티 또는 주제', 'Community or topic')} aria-label={t('글 주제', 'Post topic')} aria-autocomplete="list" className="w-full min-w-0 bg-transparent font-medium text-[#332d2a] outline-none placeholder:text-[#9a918b]" />
                  {topicSuggestionsOpen && topicSuggestions.length > 0 && <ul role="listbox" className="absolute left-0 top-full z-30 mt-2 max-h-48 w-full min-w-40 overflow-y-auto rounded-xl border border-[#eadfd7] bg-white p-1.5 shadow-xl">
                    {topicSuggestions.map((suggestion) => <li key={suggestion}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setTopic(suggestion); setTopicSuggestionsOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#5f5752] hover:bg-primary-soft hover:text-primary1">#{suggestion}</button></li>)}
                  </ul>}
                </div>
              </div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                placeholder={t('새로운 소식이 있나요?', "What's new?")}
                aria-label={t('글 제목', 'Post title')}
                className="mt-1 w-full bg-transparent text-base font-medium text-[#332d2a] outline-none placeholder:text-[#9a918b] sm:text-lg"
                autoFocus
              />
            </div>
          </div>
          <div
            ref={contentEditorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={t('자세한 내용을 적어주세요.', 'Share more details.')}
            aria-label={t('글 내용', 'Post content')}
            onInput={rememberContentSelection}
            onKeyUp={rememberContentSelection}
            onPointerUp={rememberContentSelection}
            onBlur={rememberContentSelection}
            onClick={handleContentClick}
            className="ml-[52px] -mt-2 min-h-12 bg-transparent px-0 py-0 text-sm leading-6 text-[#332d2a] outline-none empty:before:pointer-events-none empty:before:text-[#9a918b] empty:before:content-[attr(data-placeholder)] sm:ml-[56px] [&_p]:min-h-6"
          />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden onChange={selectImages} />
          {message && <p className="ml-[52px] text-xs font-semibold text-alert sm:ml-[56px]" role="status">{message}</p>}
          <div className="ml-[52px] mt-1 flex items-center gap-2 pt-2 sm:ml-[56px]">
            <button type="button" disabled={images.length >= MAX_IMAGES} onMouseDown={(event) => { event.preventDefault(); rememberContentSelection(); }} onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-[#817873] transition hover:bg-[#f5f2ef] hover:text-primary1 disabled:opacity-40" aria-label={t('사진 추가', 'Add photos')} title={t('사진 추가', 'Add photos')}><FaImage className="text-2xl" aria-hidden />{images.length > 0 && <span className="text-xs font-bold">{images.length}/{MAX_IMAGES}</span>}</button>
            <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-bold text-[#817873] hover:bg-[#f5f2ef]">
              {t('취소', 'Cancel')}
            </button>
            <button type="submit" disabled={submitting} className="rounded-full bg-primary1 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
              {submitting ? t('등록 중...', 'Publishing...') : t('게시하기', 'Post')}
            </button>
            </div>
          </div>
        </form>
        </div>
      )}
      {!open && message && <p className="mt-3 px-1 text-xs font-semibold text-alert" role="status">{message}</p>}
      {editingId && (() => { const item = images.find((image) => image.id === editingId); return item ? <ImageEditor item={item} onCancel={() => setEditingId(null)} onApply={(file) => { const preview = URL.createObjectURL(file); contentEditorRef.current?.querySelector<HTMLImageElement>(`img[data-attachment-id="${editingId}"]`)?.setAttribute('src', preview); setImages((current) => current.map((image) => { if (image.id !== editingId) return image; URL.revokeObjectURL(image.preview); return { ...image, file, preview }; })); setEditingId(null); }} /> : null; })()}
    </div>
  );
}

export default function CommunityPageContent({ initialPage }: { initialPage: CommunityFeedPage }) {
  const { isEnglish } = useLanguage();
  const [posts, setPosts] = useState(initialPage.posts);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CommunitySort>('latest');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialFilterRender = useRef(true);

  const fetchPage = useCallback(async (nextCursor: string | null) => {
    const params = new URLSearchParams({ sort });
    if (nextCursor) params.set('cursor', nextCursor);
    if (search.trim()) params.set('search', search.trim());
    const response = await fetch(`/api/community/posts?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to load posts');
    return response.json() as Promise<CommunityFeedPage>;
  }, [search, sort]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const page = await fetchPage(cursor);
      setPosts((current) => {
        const known = new Set(current.map((post) => post.id));
        return [...current, ...page.posts.filter((post) => !known.has(post.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, fetchPage, loading]);

  useEffect(() => {
    if (initialFilterRender.current) {
      initialFilterRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      void fetchPage(null)
        .then((page) => { setPosts(page.posts); setCursor(page.nextCursor); })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) void loadMore(); },
      { rootMargin: '300px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col pb-7 pt-2 sm:py-10">
      <div className="mb-3 md:hidden">
        <label className="flex min-h-11 items-center gap-2 rounded-full border border-[#eadfd7] bg-white px-4 shadow-[0_3px_12px_rgba(51,45,42,0.05)] focus-within:border-primary1">
          <FaMagnifyingGlass className="shrink-0 text-sm text-[#9a918b]" aria-hidden />
          <input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={40} placeholder={isEnglish ? 'Search by name' : '이름 검색'} className="min-w-0 flex-1 bg-transparent text-sm text-[#332d2a] outline-none placeholder:text-[#9a918b]" />
        </label>
      </div>
      <div className="mb-3 hidden items-center justify-end gap-2 md:flex">
        <label className="flex min-h-10 w-64 items-center gap-2 rounded-full border border-[#eadfd7] bg-white px-4 focus-within:border-primary1">
          <FaMagnifyingGlass className="shrink-0 text-sm text-[#9a918b]" aria-hidden />
          <input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={40} placeholder={isEnglish ? 'Search by name' : '이름 검색'} className="min-w-0 flex-1 bg-transparent text-sm text-[#332d2a] outline-none placeholder:text-[#9a918b]" />
        </label>
        <select value={sort} onChange={(event) => setSort(event.target.value as CommunitySort)} aria-label={isEnglish ? 'Sort posts' : '게시글 정렬'} className="min-h-10 rounded-full border border-[#eadfd7] bg-white px-4 text-sm font-bold text-[#5f5752] outline-none focus:border-primary1">
          <option value="latest">{isEnglish ? 'Latest' : '최신순'}</option>
          <option value="likes">{isEnglish ? 'Most liked' : '좋아요 많은 순'}</option>
        </select>
      </div>
      <CommunityComposer onCreated={(post) => { if (!search.trim() && sort === 'latest') setPosts((current) => [post, ...current]); }} />

      {posts.length > 0 ? (
        <div className="flex flex-col gap-2 sm:gap-3">
          {posts.map((post) => <CommunityCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#eadfd7] bg-white px-6 py-16 text-center text-sm text-[#817873]">
          {isEnglish ? 'No stories have been posted yet.' : '아직 등록된 이야기가 없어요.'}
        </div>
      )}

      <div ref={sentinelRef} className="flex min-h-24 items-center justify-center py-6" aria-live="polite">
        {loading && <span className="text-sm font-semibold text-[#817873]">{isEnglish ? 'Loading more stories...' : '이야기를 더 불러오는 중...'}</span>}
        {failed && <button type="button" onClick={() => void loadMore()} className="rounded-full border border-primary1/30 bg-white px-4 py-2 text-sm font-bold text-primary1">{isEnglish ? 'Try again' : '다시 불러오기'}</button>}
        {!cursor && posts.length > 0 && <span className="text-xs text-[#9a918b]">{isEnglish ? 'You have reached the end.' : '모든 이야기를 확인했어요.'}</span>}
      </div>
    </section>
  );
}
