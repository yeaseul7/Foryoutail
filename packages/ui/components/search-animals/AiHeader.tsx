'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { MdPhotoCamera, MdSearch, MdCheckCircle } from 'react-icons/md';
import AiSearchFilterSelects from './AiSearchFilterSelects';
import type { AiSearchFiltersValues } from './AiSearchFilters';

export interface AiHeaderProps {
    previewUrl: string | null;
    searchLoading: boolean;
    modelReady?: boolean;
    dailyAiUsed?: number | null;
    dailyLimit?: number;
    /** 지역·동물 필터 (선택) */
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
    dailyLimit = 3,
    filters = defaultFilters,
    onFiltersChange,
    onFileChange,
    onSearch,
    onLoadModel,
}: AiHeaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [internalFilters, setInternalFilters] = useState<AiSearchFiltersValues>(filters ?? defaultFilters);
    const isControlled = onFiltersChange != null;
    const currentFilters = isControlled ? (filters ?? defaultFilters) : internalFilters;
    const handleFiltersChange = isControlled ? onFiltersChange : setInternalFilters;

    return (
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* 헤더: AI 친구 찾기 + 사용 횟수(눈에 띄게) + 설명 */}
            <header className="text-center mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    사진 한 장이면 충분해요
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
                    AI가 보호소 공고 사진을 기반으로 분석하여 가장 닮은 공고를 찾아드립니다.
                    <br className="hidden sm:block" />
                    <span className="text-primary1 font-medium">2026년 2월 5일</span> 이후 업데이트된 공고 데이터를 기반으로 분석합니다.
                </p>
            </header>

            {/* 메인 카드: 동물 버튼 + 업로드 + 필터 + 검색 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-7 md:p-8">
                    <div className="mb-4 sm:mb-5">
                        <AiSearchFilterSelects value={currentFilters} onChange={handleFiltersChange} />
                    </div>

                    <div className="grid min-h-[220px] grid-cols-1 gap-3 md:min-h-[260px] md:grid-cols-6 md:gap-4">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            className="cursor-pointer md:col-span-3"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={onFileChange}
                                className="sr-only"
                                aria-label="강아지/고양이 사진 업로드"
                            />
                            <div className="relative flex h-full min-h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 transition-colors hover:border-primary1 hover:bg-primary1/5 md:min-h-[260px]">
                                {previewUrl ? (
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="업로드한 사진" className="h-full w-full object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative mb-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 ring-4 ring-gray-200 sm:h-20 sm:w-20">
                                                <MdPhotoCamera className="h-8 w-8 text-blue-500 sm:h-10 sm:w-10" />
                                            </div>
                                            <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-sm font-bold text-blue-500 shadow-sm">
                                                +
                                            </span>
                                        </div>
                                        <p className="mb-1 text-base font-bold text-gray-800">
                                            이미지 업로드
                                        </p>
                                        <p className="px-4 text-center text-sm text-gray-500">
                                            드래그 앤 드롭 하거나 클릭하여 사진을 추가하세요
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 md:col-span-3 md:min-h-[260px]">
                            <Image
                                src="/static/images/example1.jpeg"
                                alt="좋은 예시"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority={false}
                            />
                            <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                                <MdCheckCircle className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                                좋은 예시
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-5 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={onSearch}
                            disabled={!previewUrl || searchLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary1 hover:bg-primary1/90 text-white font-medium py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <MdSearch className="w-5 h-5 shrink-0" />
                            {searchLoading
                                ? '검색 중...'
                                : dailyAiUsed != null
                                    ? `AI로 닮은 친구 찾기 (${Math.max(dailyLimit - dailyAiUsed, 0)}회 남음)`
                                    : 'AI로 닮은 친구 찾기'}
                        </button>
                        {!modelReady && !searchLoading && onLoadModel && (
                            <button
                                type="button"
                                onClick={onLoadModel}
                                className="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                AI 모델 로드하기
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
