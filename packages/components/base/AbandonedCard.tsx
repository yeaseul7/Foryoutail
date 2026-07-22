'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import {
  normalizeAnimalImageUrl,
  shouldBypassNextImageOptimization,
} from '@/packages/utils/imageSource';
import {
  HiHeart,
  HiOutlineHeart,
} from 'react-icons/hi2';
import { FaPaw } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { useShelterLike } from '@/hooks/useShelterLike';
import CardImage from '@/packages/components/common/CardImage';

export default function AbandonedCard({
  shelterAnimal,
}: {
  shelterAnimal: ShelterAnimalItem;
}) {
  const router = useRouter();
  const desertionNo = shelterAnimal.desertionNo;
  const { isLiked, isUpdating, handleLike } = useShelterLike(
    desertionNo,
    shelterAnimal,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [prevDesertionNo, setPrevDesertionNo] = useState(shelterAnimal.desertionNo);

  if (shelterAnimal.desertionNo !== prevDesertionNo) {
    setPrevDesertionNo(shelterAnimal.desertionNo);
    setCurrentImageIndex(0);
  }

  const availableImages = useMemo(() => {
    const images: string[] = [];
    for (let i = 1; i <= 8; i++) {
      const popfile = shelterAnimal[
        `popfile${i}` as keyof ShelterAnimalItem
      ] as string | undefined;
      if (popfile && typeof popfile === 'string' && popfile.trim() !== '') {
        images.push(popfile);
      }
    }
    return images;
  }, [shelterAnimal]);

  const currentImageUrl = useMemo(() => {
    if (availableImages.length === 0) return null;
    if (currentImageIndex >= availableImages.length) return null;
    return availableImages[currentImageIndex];
  }, [availableImages, currentImageIndex]);

  const thumbnailImage = useMemo(() => {
    if (!currentImageUrl) return null;
    if (currentImageUrl.includes('res.cloudinary.com')) {
      return getOptimizedCloudinaryUrl(currentImageUrl, 150, 150);
    }
    return normalizeAnimalImageUrl(currentImageUrl);
  }, [currentImageUrl]);

  const defaultImage = useMemo(() => {
    if (shelterAnimal.upKindNm === '417000') {
      return '/static/images/defaultDog.png';
    }
    if (shelterAnimal.kindCd === '422400') {
      return '/static/images/defaultCat.png';
    }
    return '/static/images/defaultDog.png';
  }, [shelterAnimal.upKindNm, shelterAnimal.kindCd]);

  // 이미지가 없거나 모든 이미지가 실패한 경우 기본 이미지 사용
  const displayImage = useMemo(() => {
    if (
      availableImages.length === 0 ||
      currentImageIndex >= availableImages.length
    ) {
      return defaultImage;
    }
    return thumbnailImage || defaultImage;
  }, [availableImages.length, currentImageIndex, thumbnailImage, defaultImage]);

  const shouldUseUnoptimizedImage = useMemo(
    () => shouldBypassNextImageOptimization(displayImage),
    [displayImage],
  );

  /** 공고종료·입양완료 등 processState에 '종료'가 포함된 경우 */
  const isProcessEnded = useMemo(() => {
    const s = shelterAnimal.processState?.trim();
    return Boolean(s && s.includes('종료'));
  }, [shelterAnimal.processState]);

  const statusBadge = useMemo(() => {
    const state = shelterAnimal?.processState || '상태 미확인';
    const isProtecting = state === '보호중';
    const hasEnd = state.includes('종료'); // 종료 포함 상태(예: 공고종료 등)
    if (!isProtecting && hasEnd) {
      return {
        text: state,
        bgColor: '#E5E5E5', // 연한 회색
        textColor: '#6B6B6B', // 진한 회색 텍스트
      };
    }
    return {
      text: state,
      bgColor: '#E9EBFD', // 연한 라벤더/퍼플 블루
      textColor: '#575FE5', // 진한 블루 퍼플 텍스트
    };
  }, [shelterAnimal]);

  const headlineSpecialMark = useMemo(() => {
    const raw = shelterAnimal.specialMark?.trim();
    if (!raw || raw === '-') return '특징 없음';
    return raw;
  }, [shelterAnimal.specialMark]);

  const ageLabel = useMemo(() => {
    if (!shelterAnimal.age?.trim()) return '';
    const a = shelterAnimal.age.trim();
    return a.includes('살') ? a : `${a}살`;
  }, [shelterAnimal.age]);

  const sexLabel = useMemo(() => {
    if (!shelterAnimal.sexCd) return '';
    if (shelterAnimal.sexCd === 'M') return '수컷';
    if (shelterAnimal.sexCd === 'F') return '암컷';
    return shelterAnimal.sexCd;
  }, [shelterAnimal.sexCd]);

  const cardTitle = useMemo(() => {
    const kind = shelterAnimal.kindNm?.trim();
    return kind || headlineSpecialMark;
  }, [shelterAnimal.kindNm, headlineSpecialMark]);

  const locationLabel = useMemo(
    () => shelterAnimal.careNm?.trim() || shelterAnimal.orgNm?.trim() || '보호소 확인',
    [shelterAnimal.careNm, shelterAnimal.orgNm],
  );

  const summaryLabel = useMemo(
    () =>
      [shelterAnimal.colorCd?.trim(), sexLabel, ageLabel]
        .filter(Boolean)
        .join(' · ') || '정보 확인 중',
    [shelterAnimal.colorCd, sexLabel, ageLabel],
  );

  return (
    <article
      onClick={() => router.push(`/shelter/${shelterAnimal.desertionNo}`)}
      className="flex h-full w-full max-w-full cursor-pointer flex-col overflow-hidden rounded-[1.35rem] border-2 border-[#bfd7e8] bg-white shadow-[0_5px_12px_rgba(62,112,151,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(62,112,151,0.18)] active:scale-[0.99]"
    >
      <div className="relative m-2 mb-0 aspect-square w-[calc(100%-1rem)] overflow-hidden rounded-[1rem] bg-gray-100">
        <CardImage
          src={displayImage}
          alt={shelterAnimal?.desertionNo || '유기동물 이미지'}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
          unoptimized={shouldUseUnoptimizedImage}
          loading="lazy"
        />
        {isProcessEnded && (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gray-900/45"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
              role="img"
              aria-label="공고 종료"
            >
              <FaPaw className="h-12 w-12 text-gray-300 drop-shadow-md sm:h-14 sm:w-14" />
            </div>
          </>
        )}
        {shelterAnimal?.processState && (
          <div className="absolute right-2 top-2 z-10">
              <div
                className="rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm whitespace-nowrap"
                style={{
                  backgroundColor: statusBadge.bgColor,
                  color: statusBadge.textColor,
                }}
              >
                {statusBadge.text}
              </div>
          </div>
        )}
        <button
          type="button"
          onClick={(event) => void handleLike(event)}
          disabled={isUpdating || !desertionNo}
          aria-label={isLiked ? '찜 해제' : '찜하기'}
          className={`absolute left-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-slate-400 shadow-sm backdrop-blur-sm transition hover:text-red-500 ${isUpdating || !desertionNo ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isLiked ? (
            <HiHeart className="h-4 w-4 text-red-500" aria-hidden />
          ) : (
            <HiOutlineHeart className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <div className="flex min-w-0 items-start justify-between gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900">
            {cardTitle}
          </h3>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-slate-600">
          {summaryLabel}
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-[#4f7da3]">
          <MdLocationOn className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{locationLabel}</span>
        </p>
      </div>
    </article>
  );
}
