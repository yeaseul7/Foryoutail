'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import heroBackground from '@/static/images/background_default.png';

const HERO_TITLE = '어떤 아이를 만나고 싶으세요?';
const HERO_SUBTITLE = '나와 잘 맞는 친구를 찾아보세요';
const PHOTO_CTA_LABEL = '사진으로 비슷한 아이 찾기';
const FILTER_TOGGLE_LABEL = '필터로 자세히 찾기';

const QUICK_FILTERS = [
  { key: 'humanDog', label: '사람 좋아하는 강아지' },
  { key: 'humanCat', label: '사람 좋아하는 고양이' },
  { key: 'nearby', label: '근처 지역' },
  { key: 'gentleCat', label: '순한 고양이' },
  { key: 'gentleDog', label: '순한 강아지' },
  { key: 'young', label: '어린 동물' },
] as const;

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

  const applyQuickFilter = (key: (typeof QUICK_FILTERS)[number]['key']) => {
    const params = new URLSearchParams();
    params.set('state', 'notice');
    params.set('quickFilter', key);

    if (key === 'humanDog' || key === 'gentleDog') {
      params.set('upkind', '417000');
    }
    if (key === 'humanCat') {
      params.set('upkind', '422400');
    }
    if (key === 'gentleCat') {
      params.set('upkind', '422400');
    }
    if (key === 'nearby') {
      const uprCd = getMatchedSidoCd();
      if (uprCd) params.set('upr_cd', uprCd);
    }

    router.push(`/shelter?${params.toString()}`);
  };

  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden min-h-[340px] sm:min-h-[420px] mb-8 sm:mb-10"
      aria-labelledby="home-adoption-hero-heading"
    >
      <div className="absolute inset-0">
        <Image
          src={heroBackground}
          alt=""
          fill
          priority
          className="object-cover object-[center_35%] scale-105 blur-[3px] sm:blur-[2px]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/35" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-[#f9fcfe]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-10 sm:py-14 md:py-16 text-center">
        <h1
          id="home-adoption-hero-heading"
          className="text-2xl sm:text-3xl md:text-[2.1rem] font-bold text-gray-900 tracking-tight leading-snug"
        >
          {HERO_TITLE}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-700 font-medium">
          {HERO_SUBTITLE}
        </p>

        <div className="mt-5 sm:mt-6 flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 max-w-3xl w-full overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_FILTERS.map((quick) => (
            <button
              key={quick.key}
              type="button"
              onClick={() => applyQuickFilter(quick.key)}
              className="h-9 sm:h-10 px-3.5 sm:px-4 shrink-0 rounded-full bg-white/85 border border-white text-gray-800 text-sm font-medium shadow-sm hover:bg-white transition-colors"
            >
              {quick.label}
            </button>
          ))}
        </div>

        <div className="mt-4 sm:mt-5 w-full max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push('/search-animal')}
            className="h-12 sm:h-13 px-5 rounded-full border-2 border-[#6b85e3] bg-white/95 text-[#4f68c8] font-semibold text-sm sm:text-base hover:bg-white transition-colors"
          >
            {PHOTO_CTA_LABEL}
          </button>
          <button
            type="button"
            onClick={() => router.push('/shelter')}
            className="h-12 sm:h-13 px-5 rounded-full bg-white/90 text-gray-800 border border-white font-medium text-sm sm:text-base hover:bg-white transition-colors"
          >
            {FILTER_TOGGLE_LABEL}
          </button>
        </div>
      </div>
    </section>
  );
}
