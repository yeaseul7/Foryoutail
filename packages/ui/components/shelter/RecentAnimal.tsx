'use client';

import { useEffect, useState } from 'react';
import AbandonedCard from '@/packages/ui/components/base/AbandonedCard';
import { fetchShelterAnimalData, type AnimalFilterState } from '@/lib/api/shelter';
import type { ShelterAnimalItem } from '@/packages/type/postType';

const DEFAULT_FILTERS: AnimalFilterState = {
  sexCd: null,
  state: null,
  upKindCd: null,
  searchQuery: '',
  bgnde: null,
  endde: null,
  upr_cd: null,
};

export default function RecentAnimal() {
  const [items, setItems] = useState<ShelterAnimalItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await fetchShelterAnimalData(1, DEFAULT_FILTERS);
        if (!isMounted) return;
        setItems(result.items.slice(0, 5));
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
      <section className="mt-6 w-full">
        <h2 className="text-sm font-semibold text-gray-900 mb-2 px-1">
          최근 입양 공고
        </h2>
        <p className="text-xs text-red-500 px-1">{error}</p>
      </section>
    );
  }

  if (items === null) {
    return (
      <section className="mt-6 w-full">
        <h2 className="text-sm font-semibold text-gray-900 mb-2 px-1">
          최근 입양 공고
        </h2>
        <div className="flex gap-3 overflow-x-auto py-1 px-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[160px] sm:w-[180px] h-[210px] rounded-2xl bg-gray-100 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 w-full">
      <h2 className="text-sm font-semibold text-gray-900 mb-2 px-1">
        최근 입양 공고
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 px-1">
        {items.map((item) => (
          <div
            key={item.desertionNo}
            className="w-[180px] sm:w-[200px] flex-shrink-0"
          >
            <AbandonedCard shelterAnimal={item} />
          </div>
        ))}
      </div>
    </section>
  );
}