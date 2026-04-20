import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import Image from 'next/image';
import { PiDogFill } from 'react-icons/pi';

export default function UserProfile({
  profileUrl,
  profileName,
  imgSize,
  sizeClass,
  existName,
  iconSize,
  nameClassName = 'text-sm text-gray-700',
}: {
  profileUrl: string;
  profileName: string;
  imgSize: number;
  sizeClass: string;
  existName: boolean;
  iconSize: string;
  nameClassName?: string;
}) {
  return (
    <div className="flex gap-2 items-center">
      {profileUrl ? (
        <div className={`relative shrink-0 aspect-square ${sizeClass}`}>
          <Image
            src={getOptimizedCloudinaryUrl(profileUrl, 100, 100)}
            alt={profileName || '작성자 프로필 이미지'}
            fill
            className="object-cover rounded-full"
            sizes={`${imgSize}px`}
          />
        </div>
      ) : (
        <div
          className={`flex justify-center items-center bg-gray-200 rounded-full shrink-0 aspect-square ${sizeClass}`}
        >
          <PiDogFill className={`text-gray-500 ${iconSize}`} />
        </div>
      )}
      {existName && (
        <span className={nameClassName}>
          @{profileName || '존재하지 않는 사용자'}
        </span>
      )}
    </div>
  );
}
