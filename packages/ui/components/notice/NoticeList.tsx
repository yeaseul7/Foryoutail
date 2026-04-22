'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFullAdmin } from '@/hooks/useFullAdmin';
import { useNoticeList } from '@/hooks/useNoticeList';
import NoticeSearch from './NoticeSearch';
import NoticeListCard from './NoticeListCard';
import NoticeListCardSkeleton from './NoticeListCardSkeleton';
import { RiPencilFill } from 'react-icons/ri';

const PAGE_SIZE = 10;

export default function NoticeList() {
    const { fullAdmin } = useFullAdmin();
    const [searchQuery, setSearchQuery] = useState('');

    const {
        notices,
        loading,
        totalPages,
        currentPage,
        listNumberStart,
        goToPage,
    } = useNoticeList({ searchQuery, pageSize: PAGE_SIZE });

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
            <header className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center text-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                        공지사항
                    </h1>
                    <p className="mt-1.5 text-xs text-gray-500 sm:mt-2 sm:text-sm md:text-base">
                        포유테일의 새로운 소식과 안내를 확인하세요.
                    </p>
                </div>

            </header>

            <section className="mb-4 sm:mb-6" aria-label="공지 검색">
                <NoticeSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </section>
            {fullAdmin && (
                <div className="flex justify-center sm:justify-end">
                    <Link
                        href="/notice/write"
                        className="mb-3 inline-flex items-center gap-1.5 rounded-3xl bg-primary1 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary2 focus:outline-none focus:ring-2 focus:ring-primary1/50 sm:mb-4 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                        <RiPencilFill className="text-sm sm:text-base" />
                        공지사항 작성
                    </Link>
                </div>
            )}
            <section className="min-h-[200px] space-y-3" aria-label="공지 목록">
                {loading ? (
                    <>
                        {Array.from({ length: PAGE_SIZE }, (_, index) => (
                            <NoticeListCardSkeleton key={`skeleton-${index}`} />
                        ))}
                    </>
                ) : notices.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-xs text-gray-500 sm:py-12 sm:text-sm">
                        등록된 공지사항이 없습니다.
                    </div>
                ) : (
                    notices.map((item, index) => (
                        <NoticeListCard
                            key={item.id}
                            item={item}
                            listNumber={listNumberStart - index}
                        />
                    ))
                )}
            </section>

            <section className="mt-6 flex justify-center sm:mt-8" aria-label="페이지 이동">
                {totalPages > 1 && (
                    <nav className="flex items-center gap-0.5 sm:gap-2" aria-label="페이지네이션">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent sm:p-2"
                            aria-label="이전 페이지"
                        >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => goToPage(p)}
                                    className={`min-w-[1.75rem] rounded-full px-1.5 py-1 text-xs font-medium transition-colors sm:min-w-[2rem] sm:px-2 sm:py-1.5 sm:text-sm ${p === currentPage
                                        ? 'bg-primary1 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    aria-label={`${p}페이지`}
                                    aria-current={p === currentPage ? 'page' : undefined}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent sm:p-2"
                            aria-label="다음 페이지"
                        >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </nav>
                )}
            </section>
        </div>
    );
}
