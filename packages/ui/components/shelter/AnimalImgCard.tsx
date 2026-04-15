import { ShelterAnimalItem } from '@/packages/type/postType';
import Image from 'next/image';

interface AnimalImgCardProps {
  mainImage: string;
  animalData: ShelterAnimalItem;
  animalImgList: string[];
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
}
export default function AnimalImgCard({
  mainImage,
  animalData,
  animalImgList,
  selectedImageIndex,
  setSelectedImageIndex,
}: AnimalImgCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <Image
          src={mainImage}
          alt={animalData?.desertionNo || '동물 이미지'}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized={
            !mainImage.includes('res.cloudinary.com') &&
            !mainImage.includes('openapi.animal.go.kr') &&
            !mainImage.includes('www.animal.go.kr')
          }
          priority
        />
      </div>

      {animalImgList.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {animalImgList.slice(0, 4).map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                ? 'border-primary1 scale-105'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <Image
                src={img}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 25vw, 12.5vw"
                unoptimized={
                  !img.includes('res.cloudinary.com') &&
                  !img.includes('openapi.animal.go.kr') &&
                  !img.includes('www.animal.go.kr')
                }
              />
            </button>
          ))}
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
