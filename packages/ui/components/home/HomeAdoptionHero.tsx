'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { QuickFilterKey } from '@/lib/api/shelter';
import { HOME_HERO_QUICK_FILTERS, QUICK_FILTER_ICONS } from '@/lib/shelter/quickFilterLabels';
import { MdPhotoCamera } from 'react-icons/md';
import heroBackground from '@/static/images/background_default.png';

const HERO_TITLE = '입양 가능한 아이를 찾아보세요';
const HERO_SUBTITLE = '지역, 성격, 보호소 정보를 바탕으로 나와 잘 맞는 아이를 찾아보세요.';
const PHOTO_CTA_LABEL = '사진으로 비슷한 아이 찾기';
const MAIN_CTA_LABEL = '입양 공고 더 보기';

export default function HomeAdoptionHero() {
  const router = useRouter();

  const getMatchedSidoCd = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('matched_address');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { sidoCd?: unknown };
      return typeof parsed.sidoCd === 'string' ? parsed.sidoCd : null;
    } catch {
      return null;
    }
  };

  const applyQuickFilter = (key: QuickFilterKey) => {
    const params = new URLSearchParams();
    params.set('state', 'notice');
    params.set('quickFilter', key);

    if (key === 'nearby') {
      const uprCd = getMatchedSidoCd();
      if (uprCd) params.set('upr_cd', uprCd);
    }

    router.push(`/shelter?${params.toString()}`);
  };

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-x-hidden min-h-[340px] sm:min-h-[420px] "
      aria-labelledby="home-adoption-hero-heading"
    >
      {/* 배경만 잘라서 scale 이미지가 삐져나가지 않게 — 본문은 hover 시 세로로 잘리지 않음 */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={heroBackground}
          alt=""
          fill
          priority
          className="object-cover object-[center_35%] scale-105 blur-[3px] sm:blur-[2px]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/20" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-[#f9fcfe]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-10 sm:py-14 md:py-16 text-center">
        <h1
          id="home-adoption-hero-heading"
          className="text-2xl sm:text-3xl md:text-[2.1rem] font-bold text-gray-900 tracking-tight leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]"
        >
          {HERO_TITLE}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-800 font-semibold">
          {HERO_SUBTITLE}
        </p>

        <div className="mt-5 sm:mt-6 flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 max-w-4xl w-full overflow-x-auto whitespace-nowrap px-1 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {HOME_HERO_QUICK_FILTERS.map((quick) => {
            const Icon = QUICK_FILTER_ICONS[quick.key];
            return (
              <button
                key={quick.key}
                type="button"
                onClick={() => applyQuickFilter(quick.key)}
                className="inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 px-4 sm:px-5 shrink-0 rounded-full bg-white/90 border border-white/90 text-gray-800 text-sm sm:text-[15px] font-semibold shadow-[0_4px_14px_rgba(15,23,42,0.12)] hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,0.16)] active:translate-y-0 active:shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-all"
              >
                <Icon className="h-[18px] w-[18px] shrink-0 text-gray-700 opacity-90 sm:h-5 sm:w-5" aria-hidden />
                {quick.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 sm:mt-6 w-full max-w-3xl flex flex-col items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push('/search-animal')}
            className="w-full sm:w-auto h-12 sm:h-13 min-w-[280px] px-8 rounded-full bg-[#6b85e3] text-white font-bold text-[15px] sm:text-base hover:brightness-105 hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(107,133,227,0.42)] active:translate-y-0 active:shadow-[0_6px_16px_rgba(107,133,227,0.32)] transition-all inline-flex items-center justify-center gap-2"
          >
            <MdPhotoCamera className="h-5 w-5 shrink-0" aria-hidden />
            {PHOTO_CTA_LABEL}
          </button>
          <button
            type="button"
            onClick={() => router.push('/shelter')}
            className="h-11 sm:h-12 px-6 rounded-full border border-white/90 bg-white/80 text-[#3f5fcf] font-semibold text-sm sm:text-[15px] hover:bg-white transition-colors"
          >
            {MAIN_CTA_LABEL}
          </button>
        </div>

      </div>
    </section>
  );
}
