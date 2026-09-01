'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MdClose, MdCloudUpload } from 'react-icons/md';
import { useLanguage } from '@/lib/i18n/language';

export default function ImageSearchButton({
  onSearch,
}: {
  onSearch: (file: File) => Promise<boolean>;
}) {
  const { isEnglish } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const selectFile = (nextFile: File | null) => {
    if (!nextFile || !nextFile.type.startsWith('image/')) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  };

  const moveToAiSearch = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const succeeded = await onSearch(file);
      if (succeeded) setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={isEnglish ? 'Search by image' : '이미지로 검색'}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-primary1 transition hover:bg-primary-soft"
      >
        <Image
          src="/static/images/ai-image-search-icon.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[120] mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-[20px] border border-[#eadfd7] bg-white p-5 shadow-[0_18px_50px_rgba(51,45,42,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">{isEnglish ? 'Search with an image' : '이미지로 검색'}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={isEnglish ? 'Close' : '닫기'} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
              <MdClose className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              selectFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className="mt-4 flex min-h-48 w-full flex-col items-center justify-center overflow-hidden rounded-[14px] border-2 border-dashed border-primary1/35 bg-primary-soft p-4 text-center hover:border-primary1"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={isEnglish ? 'Selected image' : '선택한 이미지'} className="max-h-44 w-full object-contain" />
            ) : (
              <>
                <MdCloudUpload className="h-10 w-10 text-primary1" aria-hidden />
                <span className="mt-3 text-sm font-semibold text-slate-700">{isEnglish ? 'Drag an image here' : '이미지를 여기에 드래그하세요'}</span>
                <span className="mt-1 text-xs text-slate-500">{isEnglish ? 'or choose a file' : '또는 파일을 선택하세요'}</span>
              </>
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />

          {file && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void moveToAiSearch()}
              className="mt-4 w-full rounded-[14px] bg-primary1 px-5 py-3 text-sm font-bold text-white hover:bg-primary2 disabled:opacity-50"
            >
              {saving ? (isEnglish ? 'Searching...' : '검색 중...') : (isEnglish ? 'Search with AI' : 'AI로 검색')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
