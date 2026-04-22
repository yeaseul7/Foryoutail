import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import Image from 'next/image';
import { PiDogFill } from 'react-icons/pi';
interface ReasHeaderImgProps {
  currentPhotoURL: string;
  currentName: string;
}
export default function ReasHeaderImg({
  currentPhotoURL,
  currentName,
}: ReasHeaderImgProps) {
  return (
    <>
      {currentPhotoURL ? (
        <div className="relative w-16 h-16 shrink-0 aspect-square sm:w-24 sm:h-24 lg:w-32 lg:h-32">
          <div className="absolute inset-0 rounded-full border-2 border-white shadow-sm" />
          <Image
            src={getOptimizedCloudinaryUrl(currentPhotoURL, 150, 150)}
            alt={currentName || 'User'}
            fill
            className="rounded-full object-cover transition-all duration-125 ease-in border-2 border-white"
          />
        </div>
      ) : (
        <div className="flex overflow-hidden justify-center items-center w-16 h-16 rounded-full shrink-0 sm:w-24 sm:h-24 lg:w-32 lg:h-32 aspect-square bg-[#F8EDE8] border-2 border-white shadow-sm">
          <PiDogFill className="text-2xl sm:text-3xl lg:text-4xl" />
        </div>
      )}
    </>
  );
}
