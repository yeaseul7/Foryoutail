'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { MdPets, MdSearch } from 'react-icons/md';
import AiSearchFilterSelects from './AiSearchFilterSelects';
import type { AiSearchFiltersValues } from './AiSearchFilters';

export interface AiHeaderProps {
  previewUrl: string | null;
  searchLoading: boolean;
  modelReady?: boolean;
  dailyAiUsed?: number | null;
  dailyLimit?: number;
  filters?: AiSearchFiltersValues;
  onFiltersChange?: (value: AiSearchFiltersValues) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  onLoadModel?: () => void;
}

const defaultFilters: AiSearchFiltersValues = {
  sidoCd: null,
  petType: '',
};

export default function AiHeader({
  previewUrl,
  searchLoading,
  modelReady = false,
  dailyAiUsed = null,
  dailyLimit = 10,
  filters = defaultFilters,
  onFiltersChange,
  onFileChange,
  onSearch,
  onLoadModel,
}: AiHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="mx-auto w-full max-w-5xl px-1 pb-8 pt-10 sm:px-4 sm:pb-12 sm:pt-14">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#4f8ed8] sm:text-4xl lg:text-[2.75rem]">
          우리 아이와 닮은 유기견 찾기
        </h1>
        <p className="mt-4 text-sm font-medium text-slate-700 sm:text-base">
          AI가 매일 업데이트되는 유기견 공고를 분석하여 가장 닮은 아이를 찾아드려요
        </p>
      </header>

      <div className="mx-auto mt-8 w-full max-w-[820px] p-0">
        <AiSearchFilterSelects
          value={filters ?? defaultFilters}
          onChange={onFiltersChange ?? (() => undefined)}
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-[#94b9d8] bg-[#edf5ff] text-center transition hover:border-[#4f8ed8] hover:bg-[#e7f1ff]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="sr-only"
              aria-label="강아지 또는 고양이 사진 업로드"
            />
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="업로드한 사진"
                className="h-full w-full object-contain"
              />
            ) : (
              <>
                <MdPets className="h-12 w-12 text-[#4f8ed8] transition-transform group-hover:scale-105" aria-hidden />
                <span className="mt-4 text-base font-bold leading-6 text-[#275978]">
                  사진을 클릭하여
                  <br />
                  업로드하세요
                </span>
                <span className="mt-2 text-xs text-[#6f8da3]">JPG, PNG, WEBP</span>
              </>
            )}
          </button>

          <div className="relative aspect-square overflow-hidden">
            <Image
              src="/static/images/ai-photo-guide.png"
              alt="AI가 잘 분석하는 반려동물 사진 촬영 가이드"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 410px"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onSearch}
          disabled={!previewUrl || searchLoading}
          className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full bg-[#4f8ed8] px-8 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(79,142,216,0.28)] transition hover:bg-[#3e7fc8] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <MdSearch className="h-5 w-5" aria-hidden />
          {searchLoading ? '검색 중...' : 'AI로 찾기'}
        </button>
        {dailyAiUsed != null && (
          <p className="text-xs font-medium text-slate-500">
            오늘 {Math.max(dailyLimit - dailyAiUsed, 0)}회 남았어요
          </p>
        )}
        {!modelReady && !searchLoading && onLoadModel && (
          <button
            type="button"
            onClick={onLoadModel}
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            AI 모델 로드하기
          </button>
        )}
      </div>
    </section>
  );
}
