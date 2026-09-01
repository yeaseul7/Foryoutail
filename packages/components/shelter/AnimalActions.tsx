'use client';

import { HiHeart, HiOutlineHeart, HiShare } from 'react-icons/hi2';
import { useShelterLike } from '@/hooks/useShelterLike';
import type { ShelterAnimalItem } from '@/packages/type/postType';

export default function AnimalActions({ animal }: { animal: ShelterAnimalItem }) {
  const desertionNo = animal.desertionNo ?? '';
  const { isLiked, isUpdating, handleLike } = useShelterLike(desertionNo, animal);

  const handleShare = async () => {
    const url = `${window.location.origin}/shelter/${desertionNo}`;
    if (navigator.share) {
      await navigator.share({ title: '꼬순내 입양 공고', url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    alert('공유 링크가 복사되었습니다.');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLike}
        disabled={isUpdating}
        aria-label={isLiked ? '관심 공고 해제' : '관심 공고 저장'}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isLiked ? 'bg-red-100 hover:bg-red-200' : 'bg-gray-100 hover:bg-gray-200'} ${isUpdating ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {isLiked ? <HiHeart className="h-5 w-5 text-alert" /> : <HiOutlineHeart className="h-5 w-5 text-[#817873]" />}
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label="공고 공유"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
      >
        <HiShare className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
}
