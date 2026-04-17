'use client';

import { useState } from 'react';
import Link from 'next/link';
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

export default function LikeAnimals({ searchError, searchMatches }: LikeAnimalsProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const limited = searchMatches != null ? searchMatches.slice(0, MAX_DISPLAY) : [];
    const totalPages = Math.max(1, Math.ceil(limited.length / PER_PAGE));
    const pageClamped = Math.min(Math.max(1, currentPage), totalPages);
    const start = (pageClamped - 1) * PER_PAGE;
    const pageItems = limited.slice(start, start + PER_PAGE);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-6">
            {searchError && <p className="mb-4 text-sm text-red-600">{searchError}</p>}
            {searchMatches != null && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                        제일 닮은 친구 ({limited.length}건)
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                        제일 닮은 친구 {MAX_DISPLAY}건만 보여드립니다.
                    </p>
                    {limited.length === 0 ? (
                        <p className="text-gray-500 text-sm">닮은 친구가 존재하지 않습니다.</p>
                    ) : (
                        <>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pageItems.map((m) => {
                                    const desertionNo = getDesertionNo(m);
                                    return (
                                        <li key={m.id}>
                                            <Link
                                                href={`/shelter/${desertionNo}`}
                                                className="block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                                    {typeof m.metadata?.imageUrl === 'string' ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={m.metadata.imageUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                                                            🐾
                                                        </div>
                                                    )}
                                                    {m.score != null && (
                                                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-primary1 text-xs font-semibold shadow-md ring-1 ring-black/5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary1/80 shrink-0" aria-hidden />
                                                            유사도 {(m.score * 100).toFixed(0)}%
                                                        </span>
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
                </div>
            )}
        </div>
    );
}
