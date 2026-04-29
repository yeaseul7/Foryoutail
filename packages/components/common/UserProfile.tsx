'use client';

import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
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
  const optimizedProfileUrl = useMemo(
    () => getOptimizedCloudinaryUrl(profileUrl, 100, 100),
    [profileUrl],
  );
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [optimizedProfileUrl]);

  return (
    <div className="flex gap-2 items-center">
      {profileUrl && !hasImageError ? (
        <div className={`relative shrink-0 aspect-square ${sizeClass}`}>
          <Image
            src={optimizedProfileUrl}
            alt={profileName || '작성자 프로필 이미지'}
            fill
            className="object-cover rounded-full"
            sizes={`${imgSize}px`}
            unoptimized
            onError={() => setHasImageError(true)}
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
