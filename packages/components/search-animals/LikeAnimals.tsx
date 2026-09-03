'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';
import type { SimilarMatch } from '@/lib/search-animal/types';

const MAX_DISPLAY = 24;
const PER_PAGE = 6;

export interface LikeAnimalsProps {
    searchError: string | null;
    searchMatches: SimilarMatch[] | null;
}

function getDesertionNo(m: SimilarMatch): string {
    const no = m.metadata && typeof m.metadata.desertionNo === 'string' ? m.metadata.desertionNo : m.id;
    return no;
}

function getMetaText(m: SimilarMatch, key: string): string | null {
    const value = m.metadata?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getCardTitle(m: SimilarMatch): string {
    return (
        getMetaText(m, 'kindNm') ??
        getMetaText(m, 'kindFullNm') ??
        getMetaText(m, 'specialMark') ??
        '닮은 친구'
    );
}

function getCardSubtitle(m: SimilarMatch): string | null {
    return (
        getMetaText(m, 'careNm') ??
        getMetaText(m, 'orgNm') ??
        getMetaText(m, 'happenPlace')
    );
}

function getCardMetaLine(m: SimilarMatch): string | null {
    const age = getMetaText(m, 'age');
    const sex = getMetaText(m, 'sexCd');
    const weight = getMetaText(m, 'weight');
    const parts = [age, sex, weight].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : null;
}

export default function LikeAnimals({ searchError, searchMatches }: LikeAnimalsProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const limited = searchMatches != null ? searchMatches.slice(0, MAX_DISPLAY) : [];
    const totalPages = Math.max(1, Math.ceil(limited.length / PER_PAGE));
    const pageClamped = Math.min(Math.max(1, currentPage), totalPages);
    const start = (pageClamped - 1) * PER_PAGE;
    const pageItems = limited.slice(start, start + PER_PAGE);

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            {searchError && <p className="mb-4 text-sm text-red-600">{searchError}</p>}
            {searchMatches != null && (
                <section className="mt-5 pt-5 border-t border-slate-100">
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 sm:text-[1.05rem]">
                                사진과 비슷한 동물 <span className="text-primary1">({limited.length}건)</span>
                            </h3>
                        </div>
                        <div className="hidden rounded-full border border-primary1/15 bg-primary1/8 px-3 py-1 text-[11px] font-semibold text-primary1 sm:inline-flex">
                            상위 {MAX_DISPLAY}건
                        </div>
                    </div>

                    {limited.length === 0 ? (
                        <p className="text-gray-500 text-sm">닮은 친구가 존재하지 않습니다.</p>
                    ) : (
                        <>
                            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                                {pageItems.map((m) => {
                                    const desertionNo = getDesertionNo(m);
                                    const title = getCardTitle(m);
                                    const subtitle = getCardSubtitle(m);
                                    const metaLine = getCardMetaLine(m);
                                    return (
                                        <li key={m.id}>
                                            <Link
                                                href={`/${desertionNo}`}
                                                className="group block overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
                                            >
                                                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                                    {typeof m.metadata?.imageUrl === 'string' ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={m.metadata.imageUrl}
                                                            alt=""
                                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-4xl text-gray-400">
                                                            🐾
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/28 via-slate-950/10 to-transparent" />
                                                    {m.score != null && (
                                                        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/96 px-3 py-1.5 text-xs font-semibold text-primary1 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary1/80" aria-hidden />
                                                            유사도 {(m.score * 100).toFixed(0)}%
                                                        </span>
                                                    )}
                                                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                                                        AI 추천
                                                    </span>
                                                </div>
                                                <div className="space-y-2 px-4 pb-4 pt-3.5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="line-clamp-1 text-[15px] font-bold leading-snug text-slate-900 sm:text-base">
                                                                {title}
                                                            </h4>
                                                            {subtitle && (
                                                                <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-[13px]">
                                                                    {subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-primary1/10 group-hover:text-primary1">
                                                            <MdArrowOutward className="h-4 w-4" aria-hidden />
                                                        </span>
                                                    </div>
                                                    {metaLine && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                                                {metaLine}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                            {totalPages > 1 && (
                                <nav
                                    className="mt-6 flex items-center justify-center gap-2"
                                    aria-label="제일 닮은 친구 목록 페이지"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={pageClamped <= 1}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        이전
                                    </button>
                                    <span className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setCurrentPage(p)}
                                                className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-medium ${p === pageClamped
                                                    ? 'bg-primary1 text-white'
                                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={pageClamped >= totalPages}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        다음
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
