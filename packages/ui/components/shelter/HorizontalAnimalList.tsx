'use client';

import { useEffect, useState } from 'react';
import {
  fetchShelterAnimalDataNoticeProtectMerged,
  type AnimalFilterState,
} from '@/lib/api/shelter';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import HorizontalAnimalCardSkeleton from '@/packages/ui/components/base/HorizontalAnimalCardSkeleton';
import {
  DISPLAY_COUNT,
  HorizontalAnimalCard,
} from '@/packages/ui/components/shelter/horizontalAnimalCarousel';

const DEFAULT_FILTERS: AnimalFilterState = {
  sexCd: null,
  state: null,
  upKindCd: null,
  neuterYn: null,
  quickFilter: null,
  searchQuery: '',
  bgnde: null,
  endde: null,
  upr_cd: null,
};

export default function HorizontalAnimalList() {
  const [items, setItems] = useState<ShelterAnimalItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await fetchShelterAnimalDataNoticeProtectMerged(1, DEFAULT_FILTERS);
        if (!isMounted) return;
        setItems(result.items.slice(0, DISPLAY_COUNT));
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : '유기동물 데이터를 불러오지 못했습니다.');
        setItems([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="w-full">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <span className="h-5 w-0.5 shrink-0 rounded-full bg-primary1" aria-hidden />
          최근 입양 공고
        </h2>
        <p className="text-xs text-red-500 px-1">{error}</p>
      </section>
    );
  }

  if (items === null) {
    return (
      <section className="w-full">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <span className="h-5 w-0.5 shrink-0 rounded-full bg-primary1" aria-hidden />
          최근 입양 공고
        </h2>
        <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="snap-center">
              <HorizontalAnimalCardSkeleton />
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
    <section className="w-full">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <span className="h-5 w-0.5 shrink-0 rounded-full bg-primary1" aria-hidden />
        최근 입양 공고
      </h2>
      <div
        className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="최근 입양 공고 목록"
      >
        {items.map((item) => (
          <div key={item.desertionNo} className="snap-center">
            <HorizontalAnimalCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
