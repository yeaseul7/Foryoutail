'use client';

import { ShelterAnimalItem } from '@/packages/type/postType';
import { useState } from 'react';
import {
  normalizeAnimalImageUrl,
  shouldBypassNextImageOptimization,
} from '@/packages/utils/imageSource';
import CardImage from '@/packages/components/common/CardImage';
import { useLanguage } from '@/lib/i18n/language';

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

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <CardImage
          src={normalizedMainImage}
          alt={animalData?.desertionNo || t('동물 이미지', 'Animal photo')}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized={shouldBypassNextImageOptimization(normalizedMainImage)}
          priority
        />
      </div>

      {animalImgList.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {animalImgList.slice(0, 4).map((img, index) => {
            const normalizedImg = normalizeAnimalImageUrl(img);

            return (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${selectedImageIndex === index
                  ? 'border-primary1 scale-105'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <CardImage
                  src={normalizedImg}
                  alt={t(`이미지 ${index + 1}`, `Photo ${index + 1}`)}
                  className="object-cover"
                  sizes="(max-width: 1024px) 25vw, 12.5vw"
                  unoptimized={shouldBypassNextImageOptimization(normalizedImg)}
                />
              </button>
            );
          })}
          {animalImgList.length > 4 && (
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                +{animalImgList.length - 4}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
