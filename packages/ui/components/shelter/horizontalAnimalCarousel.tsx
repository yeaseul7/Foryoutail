'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import { useShelterLike } from '@/hooks/useShelterLike';

export const DISPLAY_COUNT = 15;

export function getFirstImageUrl(item: ShelterAnimalItem): string | null {
  for (let i = 1; i <= 8; i++) {
    const url = item[`popfile${i}` as keyof ShelterAnimalItem] as string | undefined;
    if (url && typeof url === 'string' && url.trim() !== '') return url;
  }
  return null;
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

export function getShortRegion(item: ShelterAnimalItem): string {
  const src = item.orgNm || item.careAddr || '';
  const match = src.match(/([가-힣]+[시군구])/);
  return match ? match[1] : src.slice(0, 6) || '지역 미상';
}

export function getKindLabel(item: ShelterAnimalItem): string {
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

export function HorizontalAnimalCard({ item }: { item: ShelterAnimalItem }) {
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

        {isNew && (
          <span className="absolute top-2.5 left-2.5 bg-primary1 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm">
            NEW
          </span>
        )}

        <button
          type="button"
          aria-label="관심 동물 추가"
          onClick={(e) => handleLike(e)}
          disabled={isUpdating}
          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${isLiked ? 'bg-red-100 hover:bg-red-200' : 'bg-white/75 hover:bg-white'
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

      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-1 mb-2">
          <p className="text-[15px] font-bold text-gray-900 leading-snug truncate">
            {breedLabel}
          </p>
          <p className="text-[12px] text-gray-400 whitespace-nowrap shrink-0 pt-px">
            {region}
          </p>
        </div>

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
