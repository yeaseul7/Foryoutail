'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import HorizontalAnimalCardSkeleton from '@/packages/components/skeleton/HorizontalAnimalCardSkeleton';
import { HorizontalAnimalPhotoCard } from '@/packages/components/shelter/horizontalAnimalCarousel';
import { isShelterAnimalListable } from '@/lib/client/shelter';
import { HiHeart } from 'react-icons/hi2';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const LIKED_ANIMALS_COLLECTION = 'likedAnimals';
/** 홈 '최근 인기 많은 아이 모음' 가로 목록 노출 개수 */
const MOST_LIKED_LIMIT = 5;

type MostLikedRow = { item: ShelterAnimalItem; likedCount: number };

function parseLikedCount(raw: Record<string, unknown>): number {
  const v = raw.likedCount ?? raw.likeCount;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  }
  return 0;
}

/** Firestore 문서 → 카드용 데이터 (집계 메타는 item에서 제외, 좋아요 수는 별도) */
function snapshotToMostLikedRow(
  docSnap: QueryDocumentSnapshot,
): MostLikedRow | null {
  const raw = docSnap.data() as Record<string, unknown>;
  const likedCount = parseLikedCount(raw);
  const desertionNo =
    typeof raw.desertionNo === 'string' && raw.desertionNo.trim()
      ? raw.desertionNo.trim()
      : docSnap.id.trim();
  if (!desertionNo) return null;

  const processState =
    typeof raw.processState === 'string' ? raw.processState : undefined;
  if (!isShelterAnimalListable(processState)) return null;

  const rest = { ...raw } as Record<string, unknown>;
  delete rest.likedCount;
  delete rest.likeCount;
  delete rest.likedUserID;
  delete rest.updatedAt;
  delete rest.image;
  delete rest.createdAt;
  const item = { ...(rest as Partial<ShelterAnimalItem>), desertionNo };
  return { item, likedCount };
}

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
        const q = query(
          collection(firestore, LIKED_ANIMALS_COLLECTION),
          orderBy('likedCount', 'desc'),
          limit(MOST_LIKED_LIMIT * 6),
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const list: MostLikedRow[] = [];
        snap.forEach((d) => {
          const row = snapshotToMostLikedRow(d);
          if (row) list.push(row);
        });
        setRows(list.slice(0, MOST_LIKED_LIMIT));
      } catch (e) {
        if (cancelled) return;
        console.error('likedAnimals 조회 실패:', e);
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
        {rows.map(({ item, likedCount }) => (
          <div key={item.desertionNo} className="snap-center">
            <HorizontalAnimalPhotoCard
              key={`${item.desertionNo}-${likedCount}`}
              item={item}
              likeCount={likedCount}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
