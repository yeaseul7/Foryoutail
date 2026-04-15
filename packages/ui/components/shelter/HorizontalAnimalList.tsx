'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchShelterAnimalData, type AnimalFilterState } from '@/lib/api/shelter';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import HorizontalAnimalCardSkeleton from '@/packages/ui/components/base/HorizontalAnimalCardSkeleton';
import { useShelterLike } from '@/hooks/useShelterLike';

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

function isNewNotice(item: ShelterAnimalItem): boolean {
  const sdt = item.noticeSdt || item.happenDt;
  if (!sdt) return false;
  const y = parseInt(sdt.slice(0, 4), 10);
  const m = parseInt(sdt.slice(4, 6), 10) - 1;
  const d = parseInt(sdt.slice(6, 8), 10);
  const noticeDate = new Date(y, m, d);
  const diffMs = Date.now() - noticeDate.getTime();
  return diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000;
}

function getShortRegion(item: ShelterAnimalItem): string {
  const src = item.orgNm || item.careAddr || '';
  const match = src.match(/([가-힣]+[시군구])/);
  return match ? match[1] : src.slice(0, 6) || '지역 미상';
}

function getKindLabel(item: ShelterAnimalItem): string {
  const k = item.upKindCd || item.kindCd || '';
  if (k.includes('417000') || k.includes('개')) return '강아지';
  if (k.includes('422400') || k.includes('고양이')) return '고양이';
  return '기타';
}

function getSexLabel(item: ShelterAnimalItem): string {
  if (item.sexCd === 'M') return '수컷';
  if (item.sexCd === 'F') return '암컷';
  return '미상';
}

function HorizontalAnimalCard({ item }: { item: ShelterAnimalItem }) {
  const router = useRouter();
  const imageUrl = getFirstImageUrl(item);
  const displayUrl = imageUrl?.includes('res.cloudinary.com')
    ? getOptimizedCloudinaryUrl(imageUrl, 400, 500)
    : imageUrl || '/static/images/defaultDog.png';
  const isNew = isNewNotice(item);
  const region = getShortRegion(item);
  const breedLabel = item.kindNm?.trim() || getKindLabel(item);
  const sexLabel = getSexLabel(item);
  const age = item.age?.trim() || '-';
  const { isLiked, isUpdating, handleLike } = useShelterLike(item.desertionNo, item);

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
      className="flex-shrink-0 w-[220px] sm:w-[250px] mt-4 rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.13)] transition-shadow duration-200 cursor-pointer focus:outline-none group"
    >
      {/* 이미지 */}
      <div className="relative w-full aspect-[4/5] bg-gray-100">
        <Image
          src={displayUrl}
          alt={item.desertionNo || '유기동물'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="250px"
          unoptimized={displayUrl === '/static/images/defaultDog.png'}
          loading="lazy"
        />

        {/* NEW 배지 */}
        {isNew && (
          <span className="absolute top-2.5 left-2.5 bg-primary1 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm">
            NEW
          </span>
        )}

        {/* 하트 버튼 */}
        <button
          type="button"
          aria-label="관심 동물 추가"
          onClick={(e) => handleLike(e)}
          disabled={isUpdating}
          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${
            isLiked ? 'bg-red-100 hover:bg-red-200' : 'bg-white/75 hover:bg-white'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLiked ? (
            <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* 텍스트 영역 */}
      <div className="px-3 py-2.5">
        {/* 종류 + 지역 */}
        <div className="flex items-start justify-between gap-1 mb-2">
          <p className="text-[15px] font-bold text-gray-900 leading-snug truncate">
            {breedLabel}
          </p>
          <p className="text-[12px] text-gray-400 whitespace-nowrap shrink-0 pt-px">
            {region}
          </p>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1">
          <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
            {sexLabel}
          </span>
          <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 truncate max-w-[80px]">
            {age}
          </span>

        </div>
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
