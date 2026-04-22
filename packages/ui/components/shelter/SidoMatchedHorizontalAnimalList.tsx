'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import {
  fetchShelterAnimalDataNoticeProtectMerged,
  type AnimalFilterState,
} from '@/lib/api/shelter';
import type { ShelterAnimalItem } from '@/packages/type/shelterAnimalTypes';
import RegionalNearbyAnimalCard from '@/packages/ui/components/shelter/RegionalNearbyAnimalCard';
import RegionalNearbyAnimalCardSkeleton from '@/packages/ui/components/base/RegionalNearbyAnimalCardSkeleton';
import { DISPLAY_COUNT } from '@/packages/ui/components/shelter/horizontalAnimalCarousel';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

/* -------------------------------------------------------------------------- */
/*  상수                                                                       */
/* -------------------------------------------------------------------------- */

const MATCHED_ADDRESS_KEY = 'matched_address';
const POLL_MS = 500;
const POLL_MAX_MS = 15_000;
const SKELETON_PLACEHOLDERS = 8;
const SCROLL_STEP_PX = 360;

const TITLE_NEAR_SUFFIX = ' 근처 아이들';
const DEFAULT_SECTION_TITLE = `내 지역${TITLE_NEAR_SUFFIX}`;
const FETCH_ERROR = '유기동물 데이터를 불러오지 못했습니다.';
const LIST_ARIA = '내 지역 근처 입양 공고 목록';

const SECTION_SHELL =
  'w-full pt-4 sm:pt-5 pb-6 sm:pb-8 rounded-2xl bg-gray-100 px-4 sm:px-5';

const SCROLLER_ROW =
  'flex gap-8 sm:gap-10 overflow-x-auto pt-2 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const SCROLL_NAV_BTN =
  'inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20';

const BASE_FILTERS: Omit<AnimalFilterState, 'upr_cd'> = {
  sexCd: null,
  state: null,
  upKindCd: null,
  neuterYn: null,
  quickFilter: null,
  searchQuery: '',
  bgnde: null,
  endde: null,
};

/* -------------------------------------------------------------------------- */
/*  localStorage / 라벨                                                       */
/* -------------------------------------------------------------------------- */

type MatchedSido = {
  sidoCd: string;
  sidoName: string | null;
  level1: string | null;
};

function shortenAreaLabel(level1: string | null, sidoName: string | null): string {
  const raw = (level1?.trim() || sidoName?.trim()) ?? '';
  if (!raw) return '내 지역';
  let s = raw;
  const strip = (suffix: string) => {
    if (s.endsWith(suffix)) s = s.slice(0, -suffix.length);
  };
  strip('특별자치시');
  strip('특별자치도');
  strip('특별시');
  strip('광역시');
  strip('도');
  s = s.trim();
  console.log('s', s);
  console.log('raw', raw);
  return s || raw;
}

function readMatchedSido(): MatchedSido | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MATCHED_ADDRESS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      sidoCd?: string;
      sidoName?: string | null;
      level1?: string | null;
    };
    if (parsed.sidoCd && typeof parsed.sidoCd === 'string') {
      return {
        sidoCd: parsed.sidoCd,
        sidoName: parsed.sidoName ?? null,
        level1: typeof parsed.level1 === 'string' ? parsed.level1 : null,
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchNearbyPage(matchedSido: MatchedSido): Promise<ShelterAnimalItem[]> {
  const orgNm = (matchedSido.sidoName?.trim() || matchedSido.level1?.trim()) ?? '';
  const filters: AnimalFilterState = {
    ...BASE_FILTERS,
    upr_cd: null,
    orgNm: orgNm || null,
  };
  const result = await fetchShelterAnimalDataNoticeProtectMerged(1, filters);
  return result.items.slice(0, DISPLAY_COUNT);
}

/* -------------------------------------------------------------------------- */
/*  UI 조각                                                                   */
/* -------------------------------------------------------------------------- */

function NearSectionHeading({ title }: { title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 tracking-tight">
      <svg
        className="w-5 h-5 shrink-0 text-primary1"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.724 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
      {title}
    </h2>
  );
}

function HorizontalScrollNav({
  onScroll,
}: {
  onScroll: (dir: 'left' | 'right') => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={SCROLL_NAV_BTN}
        aria-label="왼쪽으로 이동"
        onClick={() => onScroll('left')}
      >
        <MdChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={SCROLL_NAV_BTN}
        aria-label="오른쪽으로 이동"
        onClick={() => onScroll('right')}
      >
        <MdChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SectionToolbar({
  title,
  onScroll,
}: {
  title: string;
  onScroll: (dir: 'left' | 'right') => void;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <NearSectionHeading title={title} />
      <HorizontalScrollNav onScroll={onScroll} />
    </div>
  );
}

function HorizontalScroller({
  scrollerRef,
  asList,
  children,
}: PropsWithChildren<{
  scrollerRef: RefObject<HTMLDivElement | null>;
  asList?: boolean;
}>) {
  return (
    <div
      ref={scrollerRef}
      className={SCROLLER_ROW}
      {...(asList ? { role: 'list' as const, 'aria-label': LIST_ARIA } : {})}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  데이터: 매칭 주소가 생길 때까지 폴링 후 근처 공고 로드                            */
/* -------------------------------------------------------------------------- */

function useMatchedSidoNearbyAnimals() {
  const [items, setItems] = useState<ShelterAnimalItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_SECTION_TITLE);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = useCallback((dir: 'left' | 'right') => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: dir === 'left' ? -SCROLL_STEP_PX : SCROLL_STEP_PX,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    let alive = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopPoll: ReturnType<typeof setTimeout> | null = null;

    const runForMatch = async (m: MatchedSido) => {
      if (!alive) return;
      setSectionTitle(`${shortenAreaLabel(m.level1, m.sidoName)}${TITLE_NEAR_SUFFIX}`);
      try {
        const next = await fetchNearbyPage(m);
        if (!alive) return;
        setItems(next);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : FETCH_ERROR);
        setItems([]);
      }
    };

    const immediate = readMatchedSido();
    if (immediate) {
      void runForMatch(immediate);
      return () => {
        alive = false;
      };
    }

    pollTimer = setInterval(() => {
      const m = readMatchedSido();
      if (!m || !pollTimer) return;
      clearInterval(pollTimer);
      pollTimer = null;
      if (stopPoll) {
        clearTimeout(stopPoll);
        stopPoll = null;
      }
      void runForMatch(m);
    }, POLL_MS);

    stopPoll = setTimeout(() => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (!alive) return;
      if (readMatchedSido() == null) {
        setItems([]);
      }
    }, POLL_MAX_MS);

    return () => {
      alive = false;
      if (pollTimer) clearInterval(pollTimer);
      if (stopPoll) clearTimeout(stopPoll);
    };
  }, []);

  return { items, error, sectionTitle, scrollerRef, scrollByCard };
}

/* -------------------------------------------------------------------------- */
/*  페이지 섹션                                                                */
/* -------------------------------------------------------------------------- */

export default function SidoMatchedHorizontalAnimalList() {
  const { items, error, sectionTitle, scrollerRef, scrollByCard } =
    useMatchedSidoNearbyAnimals();

  if (error) {
    return (
      <section className={SECTION_SHELL}>
        <NearSectionHeading title={sectionTitle} />
        <p className="mt-2 text-xs text-red-500">{error}</p>
      </section>
    );
  }

  if (items === null) {
    return (
      <section className={SECTION_SHELL}>
        <SectionToolbar title={sectionTitle} onScroll={scrollByCard} />
        <HorizontalScroller scrollerRef={scrollerRef}>
          {Array.from({ length: SKELETON_PLACEHOLDERS }, (_, i) => (
            <div key={i} className="snap-center first:pl-0">
              <RegionalNearbyAnimalCardSkeleton />
            </div>
          ))}
        </HorizontalScroller>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={SECTION_SHELL}>
      <SectionToolbar title={sectionTitle} onScroll={scrollByCard} />
      <HorizontalScroller scrollerRef={scrollerRef} asList>
        {items.map((item) => (
          <div key={item.desertionNo} className="snap-center" role="listitem">
            <RegionalNearbyAnimalCard item={item} />
          </div>
        ))}
      </HorizontalScroller>
    </section>
  );
}
