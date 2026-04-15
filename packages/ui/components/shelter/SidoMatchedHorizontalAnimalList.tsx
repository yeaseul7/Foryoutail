'use client';

import { useEffect, useState } from 'react';
import { fetchShelterAnimalData, type AnimalFilterState } from '@/lib/api/shelter';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import RegionalNearbyAnimalCard from '@/packages/ui/components/shelter/RegionalNearbyAnimalCard';
import RegionalNearbyAnimalCardSkeleton from '@/packages/ui/components/base/RegionalNearbyAnimalCardSkeleton';
import { DISPLAY_COUNT } from '@/packages/ui/components/shelter/horizontalAnimalCarousel';

const MATCHED_ADDRESS_KEY = 'matched_address';
const POLL_MS = 500;
const POLL_MAX_MS = 15000;

function shortenAreaLabel(level1: string | null, sidoName: string | null): string {
  const raw = (level1?.trim() || sidoName?.trim()) ?? '';
  if (!raw) return '내 지역';
  let s = raw;
  const strip = (suffix: string) => {
    if (s.endsWith(suffix)) s = s.slice(0, -suffix.length);
  };
  strip('\uD2B9\uBCC4\uC790\uCE58\uC2DC');
  strip('\uD2B9\uBCC4\uC790\uCE58\uB3C4');
  strip('\uD2B9\uBCC4\uC2DC');
  strip('\uAD11\uC5ED\uC2DC');
  strip('\uB3C4');
  s = s.trim();
  return s || raw;
}

function readMatchedSido(): {
  sidoCd: string;
  sidoName: string | null;
  level1: string | null;
} | null {
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

const TITLE_NEAR_SUFFIX = ` \uADFC\uCC98 \uC544\uC774\uB4E4`;
const DEFAULT_SECTION_TITLE = `\uB0B4 \uC9C0\uC5ED${TITLE_NEAR_SUFFIX}`;
const FETCH_ERROR = `\uC720\uAE30\uB3D9\uBB3C \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.`;
const LIST_ARIA = `\uB0B4 \uC9C0\uC5ED \uADFC\uCC98 \uC785\uC591 \uACF5\uACE0 \uBAA9\uB85D`;

export default function SidoMatchedHorizontalAnimalList() {
  const [items, setItems] = useState<ShelterAnimalItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_SECTION_TITLE);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopPoll: ReturnType<typeof setTimeout> | null = null;

    const runFetch = async (
      sidoCd: string,
      sidoName: string | null,
      level1: string | null,
    ) => {
      if (!isMounted) return;
      setSectionTitle(`${shortenAreaLabel(level1, sidoName)}${TITLE_NEAR_SUFFIX}`);
      try {
        const filters: AnimalFilterState = { ...BASE_FILTERS, upr_cd: sidoCd };
        const result = await fetchShelterAnimalData(1, filters);
        if (!isMounted) return;
        setItems(result.items.slice(0, DISPLAY_COUNT));
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : FETCH_ERROR);
        setItems([]);
      }
    };

    const matched = readMatchedSido();
    if (matched) {
      void runFetch(matched.sidoCd, matched.sidoName, matched.level1);
      return () => {
        isMounted = false;
      };
    }

    pollTimer = setInterval(() => {
      const m = readMatchedSido();
      if (m && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
        if (stopPoll) {
          clearTimeout(stopPoll);
          stopPoll = null;
        }
        void runFetch(m.sidoCd, m.sidoName, m.level1);
      }
    }, POLL_MS);

    stopPoll = setTimeout(() => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (!isMounted) return;
      if (readMatchedSido() == null) {
        setItems([]);
      }
    }, POLL_MAX_MS);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      if (stopPoll) clearTimeout(stopPoll);
    };
  }, []);

  const sectionShell =
    'w-full pt-4 sm:pt-5 pb-6 sm:pb-8 rounded-2xl bg-gray-100 px-4 sm:px-5';

  if (error) {
    return (
      <section className={sectionShell}>
        <NearSectionHeading title={sectionTitle} />
        <p className="text-xs text-red-500 mt-2">{error}</p>
      </section>
    );
  }

  if (items === null) {
    return (
      <section className={sectionShell}>
        <NearSectionHeading title={sectionTitle} />
        <div className="flex gap-7 sm:gap-9 overflow-x-auto pt-2 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="snap-center first:pl-0">
              <RegionalNearbyAnimalCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={sectionShell}>
      <NearSectionHeading title={sectionTitle} />
      <div
        className="flex gap-7 sm:gap-9 overflow-x-auto pt-2 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label={LIST_ARIA}
      >
        {items.map((item) => (
          <div key={item.desertionNo} className="snap-center">
            <RegionalNearbyAnimalCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
