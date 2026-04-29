'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import type { QuickFilterKey } from '@/lib/client/shelter';
import { HOME_HERO_QUICK_FILTERS } from '@/lib/shelter/quickFilterLabels';
import {
  HiOutlineCamera,
  HiOutlineFaceSmile,
  HiOutlineHeart,
  HiOutlineMapPin,
  HiOutlineSparkles,
} from 'react-icons/hi2';

/** 히어로 전용: 같은 라인 두께(hi2 outline) + 소형 포인트 컬러 */
const QUICK_FILTER_HERO_ICONS: Record<
  QuickFilterKey,
  { Icon: IconType; accent: string }
> = {
  likesHuman: { Icon: HiOutlineHeart, accent: 'text-rose-600' },
  gentle: { Icon: HiOutlineFaceSmile, accent: 'text-emerald-600' },
  nearby: { Icon: HiOutlineMapPin, accent: 'text-sky-600' },
  young: { Icon: HiOutlineSparkles, accent: 'text-violet-600' },
};

const HERO_TITLE = '가족을 기다리는 아이를 찾아보세요';
const HERO_SUBTITLE = '지역, 성격, 보호소 정보를 바탕으로 나와 잘 맞는 아이를 찾아보세요.';
const PHOTO_CTA_LABEL = '사진으로 비슷한 아이 찾기';

export default function HomeAdoptionHero() {
  const router = useRouter();

  const getMatchedOrgNm = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('matched_address');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        sidoName?: unknown;
        level1?: unknown;
      };
      if (typeof parsed.sidoName === 'string' && parsed.sidoName.trim()) {
        return parsed.sidoName.trim();
      }
      if (typeof parsed.level1 === 'string' && parsed.level1.trim()) {
        return parsed.level1.trim();
      }
      return null;
    } catch {
      return null;
    }
  };

  const applyQuickFilter = (key: QuickFilterKey) => {
    const params = new URLSearchParams();
    params.set('quickFilter', key);

    if (key === 'nearby') {
      const orgNm = getMatchedOrgNm();
      if (orgNm) params.set('orgNm', orgNm);
    }

    router.push(`/shelter?${params.toString()}`);
  };

  return (
    <section
      className="relative left-1/2 mb-8 flex min-h-[340px] w-screen max-w-[100vw] -translate-x-1/2 flex-col overflow-x-hidden sm:mb-10 sm:min-h-[520px] md:mb-12 md:min-h-[580px]"
      aria-labelledby="home-adoption-hero-heading"
    >
      {/* 배경만 잘라서 scale 이미지가 삐져나가지 않게 — 본문은 hover 시 세로로 잘리지 않음 */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/static/images/background_default.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_48%] scale-105 sm:object-[center_46%]"
          sizes="100vw"
        />
        {/* 이미지는 선명하게 두고, 위→아래로만 밝은 스크림으로 글자 영역 안정화 */}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.55)_55%,rgba(255,255,255,0.95)_100%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-slate-900/[0.07]" aria-hidden />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-center ps-[max(1rem,env(safe-area-inset-left,0px))] pe-[max(1rem,env(safe-area-inset-right,0px))] sm:px-6 sm:py-16 md:py-20">
        <header className="mx-auto w-full max-w-[min(100%,40rem)] px-0.5 text-center sm:max-w-[44rem] sm:px-1 md:max-w-[48rem]">
          <h1
            id="home-adoption-hero-heading"
            className="break-keep text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-slate-900 [text-shadow:0_1px_0_rgb(255_255_255_/_0.75),0_2px_12px_rgb(255_255_255_/_0.35)] sm:text-4xl sm:leading-[1.15] md:text-[2.5rem] md:leading-[1.12]"
          >
            {HERO_TITLE}
          </h1>
          <p className="mx-auto mt-2.5 max-w-[34rem] break-keep text-pretty text-[0.8125rem] font-medium leading-relaxed text-[#334155] sm:mt-5 sm:text-lg md:text-xl md:leading-relaxed">
            {HERO_SUBTITLE}
          </p>
        </header>

        <div className="mt-3 flex w-full max-w-4xl flex-wrap content-center items-center justify-center gap-1 gap-y-1.5 px-0 py-1 sm:mt-6 sm:gap-2.5 sm:gap-y-2 sm:px-1 sm:py-2.5 lg:flex-nowrap lg:justify-center lg:gap-2.5 lg:overflow-x-auto lg:whitespace-nowrap lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
          {HOME_HERO_QUICK_FILTERS.map((quick) => {
            const { Icon, accent } = QUICK_FILTER_HERO_ICONS[quick.key];
            return (
              <button
                key={quick.key}
                type="button"
                onClick={() => applyQuickFilter(quick.key)}
                className="inline-flex min-h-[36px] min-w-0 max-w-[calc(50%-0.125rem)] shrink-0 items-center justify-center gap-0.5 rounded border border-gray-200/90 bg-white/95 px-1.5 py-1 text-center text-[11px] font-medium leading-tight text-gray-800 shadow-sm backdrop-blur-[2px] transition-colors active:bg-gray-50 sm:max-w-none sm:min-h-[44px] sm:gap-2 sm:rounded-lg sm:px-3.5 sm:py-2 sm:text-[15px] sm:font-semibold sm:leading-normal sm:hover:border-gray-300 sm:hover:bg-white lg:min-h-0 lg:text-base"
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5 ${accent}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {quick.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex w-full min-w-0 max-w-3xl flex-col items-center justify-center gap-2 sm:mt-8 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push('/search-animal')}
            className="inline-flex min-h-[42px] w-full max-w-md min-w-0 items-center justify-center gap-1.5 rounded-full bg-[#637dec] px-4 py-2.5 text-[13px] font-bold leading-snug text-white shadow-[0_8px_20px_rgba(99,125,236,0.22)] transition-all active:translate-y-0 active:shadow-[0_6px_14px_rgba(99,125,236,0.2)] sm:min-h-[52px] sm:w-auto sm:min-w-[280px] sm:gap-2 sm:px-[34px] sm:py-[14px] sm:text-base sm:shadow-[0_10px_24px_rgba(99,125,236,0.25)] sm:hover:-translate-y-0.5 sm:hover:bg-[#5a73e0] sm:hover:shadow-[0_12px_28px_rgba(99,125,236,0.32)] md:min-w-[300px] md:text-[17px]"
          >
            <HiOutlineCamera className="h-4 w-4 shrink-0 opacity-95 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} aria-hidden />
            {PHOTO_CTA_LABEL}
          </button>

        </div>

      </div>
    </section>
  );
}
