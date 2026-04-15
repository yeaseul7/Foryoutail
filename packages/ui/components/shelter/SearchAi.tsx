'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MdAutoAwesome, MdSearch, MdPhotoCamera } from 'react-icons/md';
import { useSearchAnimal } from '@/hooks/useSearchAnimal';

export default function SearchAi() {
    const { loadModel } = useSearchAnimal();

    useEffect(() => {
        loadModel().catch(() => { });
    }, [loadModel]);

    return (
        <div className="w-full px-0 sm:px-4">
            <div className="max-w-4xl mx-auto">
                <div className="relative rounded-2xl shadow-sm border border-indigo-100/50 overflow-hidden">
                    {/* 무지개 애니메이션 배경 레이어 */}
                    <div
                        className="search-ai-rainbow absolute inset-0 rounded-2xl"
                        aria-hidden
                    />
                    <div className="relative z-10 flex flex-col sm:flex-row">
                        {/* 왼쪽: 사진 아이콘 영역 */}
                        <div className="flex-shrink-0 flex items-center justify-center p-4 sm:p-5 sm:pr-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-indigo-200 bg-white/80 flex items-center justify-center text-indigo-400">
                                <MdPhotoCamera className="w-10 h-10 sm:w-12 sm:h-12" aria-hidden />
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-indigo-700 text-[10px] sm:text-xs font-medium w-fit mb-2.5 border border-indigo-100">
                                <MdAutoAwesome className="w-3 h-3 shrink-0" />
                                <span>AI 스마트 검색</span>
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 leading-tight">
                                소중한 인연을 연결합니다
                            </h2>
                            <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed mb-3">
                                사진 속 아이와 닮은 친구가 보호소에서 기다리고 있을까요?<br />
                                매일 업데이트되는 최신 공고 100건을 바탕으로, AI가 가장 닮은 아이를 매칭해 드립니다.
                            </p>
                            <Link
                                href="/search-animal"
                                className="inline-flex items-center justify-center gap-1.5 w-fit px-4 py-2 rounded-lg bg-primary1 text-white text-xs font-medium hover:bg-primary1/90 transition-colors"
                            >
                                <MdSearch className="w-4 h-4 shrink-0" />
                                AI로 검색하러 가기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
