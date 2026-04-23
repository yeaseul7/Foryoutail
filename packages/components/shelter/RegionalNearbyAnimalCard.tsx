'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import {
  normalizeAnimalImageUrl,
  shouldBypassNextImageOptimization,
} from '@/packages/utils/imageSource';
import {
  getFirstImageUrl,
  getKindLabel,
} from '@/packages/components/shelter/horizontalAnimalCarousel';

function getPrimaryTitle(item: ShelterAnimalItem): string {
  const mark = item.specialMark?.trim();
  if (mark && mark.length <= 12 && !mark.includes(',')) return mark;
  const k = item.kindNm?.trim();
  if (k) return k;
  const full = item.kindFullNm?.trim();
  if (full) {
    const parts = full.split(/\s*>\s*/);
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  return getKindLabel(item);
}

function getHeadlineLine(item: ShelterAnimalItem): string {
  const weight = item.weight?.trim() || getKindLabel(item);
  return `${weight}`;
}

export default function RegionalNearbyAnimalCard({ item }: { item: ShelterAnimalItem }) {
  const router = useRouter();
  const imageUrl = getFirstImageUrl(item);
  const displayUrl = imageUrl?.includes('res.cloudinary.com')
    ? getOptimizedCloudinaryUrl(imageUrl, 720, 720)
    : normalizeAnimalImageUrl(imageUrl || '/static/images/defaultDog.png');
  const detailLine = getPrimaryTitle(item);
  const headlineLine = getHeadlineLine(item);

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
      className="flex flex-col items-center gap-3 sm:gap-3.5 shrink-0 w-[178px] sm:w-[208px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1 focus-visible:ring-offset-2 rounded-xl group"
    >
      <div className="relative w-[168px] h-[168px] sm:w-[196px] sm:h-[196px] rounded-full overflow-hidden bg-gray-100 shadow-[0_5px_24px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.06] transition-transform duration-200 group-hover:scale-[1.04]">
        <Image
          src={displayUrl}
          alt={item.desertionNo || '유기동물'}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 168px, 196px"
          unoptimized={shouldBypassNextImageOptimization(displayUrl)}
          loading="lazy"
        />
      </div>

      <div className="flex flex-col items-center gap-1 w-full px-0.5">
        <p className="text-[16px] sm:text-lg font-bold text-gray-900 text-center leading-snug line-clamp-2 break-keep">
          {headlineLine}
        </p>
        <p className="text-[13px] sm:text-sm text-gray-500 text-center leading-snug line-clamp-2 break-all">
          {detailLine}
        </p>
      </div>
    </article>
  );
}
