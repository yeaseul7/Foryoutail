'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchShelterAnimalData, type AnimalFilterState } from '@/lib/api/shelter';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import HorizontalAnimalCardSkeleton from '@/packages/ui/components/base/HorizontalAnimalCardSkeleton';

const DISPLAY_COUNT = 15;
const DEFAULT_FILTERS: AnimalFilterState = {
  sexCd: null,
  state: null,
  upKindCd: null,
  searchQuery: '',
  bgnde: null,
  endde: null,
  upr_cd: null,
};

function getFirstImageUrl(item: ShelterAnimalItem): string | null {
  for (let i = 1; i <= 8; i++) {
    const url = item[`popfile${i}` as keyof ShelterAnimalItem] as string | undefined;
    if (url && typeof url === 'string' && url.trim() !== '') return url;
  }
  return null;
}

function formatLocationYearId(item: ShelterAnimalItem): string {
  const org = item.orgNm?.trim() || item.careAddr?.trim() || '';
  const place = org.replace(/\s+/g, '-').slice(0, 20) || '지역';
  const year = item.noticeSdt?.slice(0, 4) || item.happenDt?.slice(0, 4) || '----';
  return `${place}-${year}`;
}

function formatAgeSexWeight(item: ShelterAnimalItem): string {
  const age = item.age?.trim() || '-';
  const sex = item.sexCd === 'M' ? '수컷' : item.sexCd === 'F' ? '암컷' : item.sexCd || '-';
  const weight = item.weight ? `${item.weight}` : '-';
  return `${age} | ${sex} | ${weight}`;
}

function HorizontalAnimalCard({ item }: { item: ShelterAnimalItem }) {
  const router = useRouter();
  const imageUrl = getFirstImageUrl(item);
  const displayUrl = imageUrl?.includes('res.cloudinary.com')
    ? getOptimizedCloudinaryUrl(imageUrl, 200, 200)
    : imageUrl || '/static/images/defaultDog.png';

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/shelter/${item.desertionNo}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/shelter/${item.desertionNo}`);
        }
      }}
      className="flex-shrink-0 w-[240px] sm:w-[260px] overflow-hidden  cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary1/30 mt-4"
    >
      <div className="relative w-full aspect-square bg-gray-100 rounded-2xl">
        <Image
          src={displayUrl}
          alt={item.desertionNo || '유기동물'}
          fill
          className="object-cover rounded-2xl"
          sizes="180px"
          unoptimized={displayUrl === '/static/images/defaultDog.png'}
          loading="lazy"
        />
      </div>
      <div className="py-2 text-left">
        <p className="text-sm text-gray-700 truncate font-bold" title={formatLocationYearId(item)}>
          {formatLocationYearId(item)}
        </p>
        <p className="text-sm text-gray-600 truncate mt-0.5 font-medium">
          {formatAgeSexWeight(item)}
        </p>
      </div>
    </article>
  );
}

export default function HorizontalAnimalList() {
  const [items, setItems] = useState<ShelterAnimalItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await fetchShelterAnimalData(1, DEFAULT_FILTERS);
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
      <section className="w-full py-4">
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
      <section className="w-full py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <span className="h-5 w-0.5 shrink-0 rounded-full bg-primary1" aria-hidden />
          최근 입양 공고
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
    <section className="w-full py-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <span className="h-5 w-0.5 shrink-0 rounded-full bg-primary1" aria-hidden />
        최근 입양 공고
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
