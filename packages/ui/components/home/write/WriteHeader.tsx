'use client';

import type { PostBoardCategory } from '@/packages/type/postType';
import { HiPlus, HiXMark } from 'react-icons/hi2';
import Image from 'next/image';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import Category from './Category';

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;

function validateAndMerge(current: File[], incoming: File[]): File[] {
  const out = [...current];
  for (const file of incoming) {
    if (out.length >= MAX_FILES) break;
    if (!file.type.startsWith('image/')) continue;
    if (file.size > MAX_BYTES) {
      window.alert(`${file.name}: 이미지는 5MB 이하만 올릴 수 있어요.`);
      continue;
    }
    out.push(file);
  }
  return out;
}

export default function WriteHeader({
  writeCategory,
  setWriteCategory,
  coverFiles,
  onCoverFilesChange,
}: {
  writeCategory: PostBoardCategory;
  setWriteCategory: Dispatch<SetStateAction<PostBoardCategory>>;
  coverFiles: File[];
  onCoverFilesChange: (files: File[]) => void;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrls = useMemo(
    () => coverFiles.map((f) => URL.createObjectURL(f)),
    [coverFiles],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  const openPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list?.length) return;
      onCoverFilesChange(validateAndMerge(coverFiles, Array.from(list)));
      e.target.value = '';
    },
    [coverFiles, onCoverFilesChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      onCoverFilesChange(coverFiles.filter((_, i) => i !== index));
    },
    [coverFiles, onCoverFilesChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dropped = Array.from(e.dataTransfer.files || []).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (dropped.length) onCoverFilesChange(validateAndMerge(coverFiles, dropped));
    },
    [coverFiles, onCoverFilesChange],
  );

  const hasFiles = coverFiles.length > 0;

  return (
    <div className="flex w-full flex-col items-start justify-start gap-3">
      <h3 className="pb-1 text-xl font-bold">글 작성하기</h3>
      <Category writeCategory={writeCategory} setWriteCategory={setWriteCategory} />

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={onInputChange}
      />

      <div className="w-full">
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/60 px-4 py-8 text-center transition-colors hover:border-sky-300 hover:bg-sky-50 sm:py-10"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <HiPlus className="h-6 w-6" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-base font-bold text-gray-900">사진을 올려주세요</span>
          <span className="max-w-md text-xs leading-relaxed text-gray-500 sm:text-sm">
            우리 아이의 일상이나 입양 후 이야기를 편하게 남겨보세요.
          </span>
          {coverFiles.length > 0 && (
            <span className="text-xs font-medium text-sky-700">
              선택됨 {coverFiles.length}/{MAX_FILES} · 등록 시에만 서버에 저장돼요
            </span>
          )}
        </button>

        {hasFiles && (
          <div className="mt-3 flex flex-wrap gap-2">
            {previewUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(index);
                  }}
                  className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="이 사진 제거"
                >
                  <HiXMark className="h-4 w-4" />
                </button>
              </div>
            ))}
            {coverFiles.length < MAX_FILES && (
              <button
                type="button"
                onClick={openPicker}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs font-medium text-gray-600 hover:border-sky-300 hover:bg-sky-50/50"
              >
                추가
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
