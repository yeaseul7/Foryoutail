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
import Image from 'next/image';

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
  const species = `${animalData.upKindCd || ''} ${animalData.upKindNm || ''}`.toLowerCase();
  const defaultImage = species.includes('422400') || species.includes('고양이') || species.includes('cat')
    ? '/static/images/defaultCat.png'
    : species.includes('429900') || species.includes('기타') || species.includes('other')
      ? '/static/images/defaultOtherAnimals.png'
      : '/static/images/defaultDog.png';
  const mainImage = animalImgList[selectedImageIndex] || defaultImage;
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
          fallbackSrc={defaultImage}
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
      <div className="flex items-center gap-3">
        <Image
          src="/static/images/findme-thank-you.png"
          alt=""
          width={56}
          height={56}
          className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
        />
        <div className="relative flex min-h-12 flex-1 items-center rounded-lg bg-primary-soft px-3 py-2 before:absolute before:-left-2 before:top-1/2 before:-translate-y-1/2 before:border-y-[7px] before:border-r-[9px] before:border-y-transparent before:border-r-primary-soft sm:min-h-14 sm:px-4">
          <p className="whitespace-pre-line text-[11px] font-bold leading-4 text-primary1 sm:text-xs sm:leading-5">
            {t(
              'Find me와 함께 인연을 찾아주셔서 감사합니다.\n작은 관심이 큰 힘이 됩니다',
              'Thank you for finding a connection with Find me.\nYour care makes a meaningful difference.',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
