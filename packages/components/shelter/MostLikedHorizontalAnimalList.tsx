'use client';

import { useEffect, useRef, useState } from 'react';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import HorizontalAnimalCardSkeleton from '@/packages/components/skeleton/HorizontalAnimalCardSkeleton';
import { HorizontalAnimalPhotoCard } from '@/packages/components/shelter/horizontalAnimalCarousel';
import { HiHeart } from 'react-icons/hi2';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

/** 홈 '최근 인기 많은 아이 모음' 가로 목록 노출 개수 */
const MOST_LIKED_LIMIT = 5;

type MostLikedRow = { item: ShelterAnimalItem; likedCount: number };

const LIST_ROW_GAP =
  'flex gap-6 sm:gap-8 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export default function MostLikedHorizontalAnimalList() {
  const [rows, setRows] = useState<MostLikedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 'left' | 'right') => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/animal-likes/top?limit=${MOST_LIKED_LIMIT}`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || '좋아요 순위 데이터를 불러오지 못했습니다.');
        }

        const body = (await res.json()) as { items?: MostLikedRow[] };
        if (cancelled) return;
        setRows(body.items ?? []);
      } catch (e) {
        if (cancelled) return;
        console.error('animal_likes 조회 실패:', e);
        setError(
          e instanceof Error
            ? e.message
            : '좋아요 순위 데이터를 불러오지 못했습니다.',
        );
        setRows([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section className="w-full">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <HiHeart className="w-5 h-5 shrink-0 text-primary1" aria-hidden />
            최근 인기 많은 아이 모음
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => scrollByCard('left')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="왼쪽으로 이동">
              <MdChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scrollByCard('right')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="오른쪽으로 이동">
              <MdChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-red-500 px-1 mt-1">{error}</p>
      </section>
    );
  }

  if (rows === null) {
    return (
      <section className="w-full">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <HiHeart className="w-5 h-5 shrink-0 text-primary1" aria-hidden />
            최근 인기 많은 아이 모음
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => scrollByCard('left')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="왼쪽으로 이동">
              <MdChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scrollByCard('right')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="오른쪽으로 이동">
              <MdChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={scrollerRef} className={LIST_ROW_GAP}>
          {Array.from({ length: MOST_LIKED_LIMIT }).map((_, i) => (
            <div key={i} className="snap-center">
              <HorizontalAnimalCardSkeleton photoOnly />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <HiHeart className="w-5 h-5 shrink-0 text-primary1" aria-hidden />
          최근 인기 많은 아이 모음
        </h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => scrollByCard('left')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="왼쪽으로 이동">
            <MdChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => scrollByCard('right')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="오른쪽으로 이동">
            <MdChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollerRef} className={LIST_ROW_GAP} role="list" aria-label="최근 인기 많은 아이 모음 유기동물 목록">
        {rows.map(({ item, likedCount }, index) => (
          <div
            key={`${item.id ?? item.desertionNo}-${item.noticeNo ?? likedCount ?? index}`}
            className="snap-center"
          >
            <HorizontalAnimalPhotoCard
              key={`${item.id ?? item.desertionNo}-${likedCount}`}
              item={item}
              likeCount={likedCount}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
