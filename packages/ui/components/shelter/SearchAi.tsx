'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdAutoAwesome, MdSearch } from 'react-icons/md';
import aiBackground from '@/static/images/aibackground.png';
import { useSearchAnimal } from '@/hooks/useSearchAnimal';

export default function SearchAi() {
  const { loadModel } = useSearchAnimal();

  useEffect(() => {
    loadModel().catch(() => {});
  }, [loadModel]);

  return (
    <div className="mt-6 w-full sm:mt-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="relative min-h-[12.5rem] overflow-hidden rounded-2xl border border-slate-200/50 shadow-lg sm:min-h-[14rem] sm:rounded-3xl">
          <Image
            src={aiBackground}
            alt=""
            fill
            className="object-cover object-[75%_center] sm:object-right"
            sizes="(max-width: 1280px) 100vw, 80rem"
            priority={false}
          />
          <div
            className="absolute inset-0 z-[1] rounded-2xl bg-gradient-to-r from-slate-900/72 via-slate-900/35 to-transparent sm:rounded-3xl sm:from-slate-900/65 sm:via-slate-900/28"
            aria-hidden
          />
          <div className="relative z-10 flex min-h-[12.5rem] flex-col items-start justify-center gap-0 px-6 py-8 sm:min-h-[14rem] sm:px-10 sm:py-10">
            <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-200/95 px-3 py-1 text-[11px] font-semibold text-blue-950 shadow-sm sm:text-xs">
              <MdAutoAwesome className="h-3.5 w-3.5 shrink-0 text-blue-800 sm:h-4 sm:w-4" />
              <span>AI 스마트 검색</span>
            </div>
            <h2 className="max-w-3xl text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl">
              사진 한 장으로 비슷한 아이를 찾아보세요
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90 sm:mt-3 sm:text-base">
              마음에 드는 아이 사진을 올리면, AI가 보호소 공고 중 닮은 친구를 찾아 드립니다.
            </p>
            <Link
              href="/search-animal"
              className="mt-6 inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary1 shadow-md transition-colors hover:bg-blue-50 sm:mt-7 sm:px-7 sm:py-3.5 sm:text-[15px]"
            >
              <MdSearch className="h-5 w-5 shrink-0" aria-hidden />
              AI로 검색하러 가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
