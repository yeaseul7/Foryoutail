'use client';

import { ShelterAnimalItem } from '@/packages/type/postType';
import { useState } from 'react';
import {
  normalizeAnimalImageUrl,
  shouldBypassNextImageOptimization,
} from '@/packages/utils/imageSource';
import CardImage from '@/packages/components/common/CardImage';
import { useLanguage } from '@/lib/i18n/language';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface AnimalImgCardProps {
  animalData: ShelterAnimalItem;
  animalImgList: string[];
}
export default function AnimalImgCard({
  animalData,
  animalImgList,
}: AnimalImgCardProps) {
  const { t } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const mainImage = animalImgList[selectedImageIndex] || '/static/images/defaultDog.png';
  const normalizedMainImage = normalizeAnimalImageUrl(mainImage);
  const hasMultipleImages = animalImgList.length > 1;

  return (
    <div className="mx-auto flex w-full max-w-[19rem] flex-col gap-3 sm:max-w-[24rem] lg:max-w-none lg:gap-4">
      <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <CardImage
          src={normalizedMainImage}
          alt={animalData?.desertionNo || t('동물 이미지', 'Animal photo')}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized={shouldBypassNextImageOptimization(normalizedMainImage)}
          priority
        />
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={() => setSelectedImageIndex((index) => Math.max(0, index - 1))}
              disabled={selectedImageIndex === 0}
              aria-label={t('이전 사진', 'Previous photo')}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/60 disabled:pointer-events-none disabled:opacity-25"
            >
              <MdChevronLeft className="h-7 w-7" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setSelectedImageIndex((index) => Math.min(animalImgList.length - 1, index + 1))}
              disabled={selectedImageIndex === animalImgList.length - 1}
              aria-label={t('다음 사진', 'Next photo')}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:bg-black/60 disabled:pointer-events-none disabled:opacity-25"
            >
              <MdChevronRight className="h-7 w-7" aria-hidden />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {selectedImageIndex + 1} / {animalImgList.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
