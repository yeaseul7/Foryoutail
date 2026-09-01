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
import { useLanguage } from '@/lib/i18n/language';
import { animalBreedLabel, animalColorLabel, animalNoteLabel } from '@/lib/i18n/animal-labels';

export default function AbandonedCard({
  shelterAnimal,
  priority = false,
}: {
  shelterAnimal: ShelterAnimalItem;
  priority?: boolean;
}) {
  const router = useRouter();
  const { isEnglish, t } = useLanguage();
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

  const processStateLabel = useMemo(() => {
    const state = shelterAnimal.processState?.trim();
    if (state === 'notice') return t('공고중', 'Notice open');
    if (state === 'protect') return t('보호중', 'In protection');
    if (state === 'adopted') return t('입양 완료', 'Adopted');
    if (state === 'returned') return t('반환 완료', 'Returned');
    if (state === 'ended') return t('종료', 'Closed');
    return state || t('상태 미확인', 'Status unknown');
  }, [shelterAnimal.processState, t]);

  const isProcessEnded = useMemo(() => {
    const s = shelterAnimal.processState?.trim();
    return s === 'adopted' || s === 'returned' || s === 'ended' || Boolean(s?.includes('종료')) || Boolean(s?.includes('입양완료'));
  }, [shelterAnimal.processState]);

  const statusBadge = useMemo(() => {
    const rawState = shelterAnimal.processState?.trim().toLowerCase() || '';
    if (rawState.includes('실종') || rawState.includes('lost') || rawState.includes('긴급')) {
      return { text: processStateLabel, bgColor: '#FDE8E6', textColor: '#D9473F' };
    }
    if (rawState === 'adopted' || rawState.includes('입양완료') || rawState.includes('발견')) {
      return { text: processStateLabel, bgColor: '#EAF1EC', textColor: '#587460' };
    }
    if (isProcessEnded) {
      return { text: processStateLabel, bgColor: '#EEECEB', textColor: '#756E69' };
    }
    return { text: processStateLabel, bgColor: '#FFF0EC', textColor: '#C74736' };
  }, [isProcessEnded, processStateLabel, shelterAnimal.processState]);

  const headlineSpecialMark = useMemo(() => {
    const raw = shelterAnimal.specialMark?.trim();
    if (!raw || raw === '-') return t('특징 없음', 'No notes');
    return animalNoteLabel(raw, isEnglish) || raw;
  }, [isEnglish, shelterAnimal.specialMark, t]);

  const ageLabel = useMemo(() => {
    if (isEnglish && shelterAnimal.birthYear) return `Born ${shelterAnimal.birthYear}`;
    if (!shelterAnimal.age?.trim()) return '';
    const a = shelterAnimal.age.trim();
    return a.includes('살') ? a : `${a}살`;
  }, [isEnglish, shelterAnimal.age, shelterAnimal.birthYear]);

  const sexLabel = useMemo(() => {
    if (!shelterAnimal.sexCd) return '';
    if (shelterAnimal.sexCd === 'M') return t('수컷', 'Male');
    if (shelterAnimal.sexCd === 'F') return t('암컷', 'Female');
    return shelterAnimal.sexCd;
  }, [shelterAnimal.sexCd, t]);

  const cardTitle = useMemo(() => {
    const kind = shelterAnimal.kindNm?.trim();
    return animalBreedLabel(kind, isEnglish) || headlineSpecialMark;
  }, [isEnglish, shelterAnimal.kindNm, headlineSpecialMark]);

  const locationLabel = useMemo(
    () => shelterAnimal.careNm?.trim() || shelterAnimal.orgNm?.trim() || t('보호소 확인', 'Check shelter'),
    [shelterAnimal.careNm, shelterAnimal.orgNm, t],
  );

  const summaryLabel = useMemo(
    () =>
      [animalColorLabel(shelterAnimal.colorCd?.trim(), isEnglish), sexLabel, ageLabel]
        .filter(Boolean)
        .join(' · ') || t('정보 확인 중', 'Details pending'),
    [isEnglish, shelterAnimal.colorCd, sexLabel, ageLabel, t],
  );

  return (
    <article
      onClick={() => router.push(`/shelter/${shelterAnimal.desertionNo}`)}
      className="flex h-full w-full max-w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#eadfd7] bg-white shadow-[0_5px_14px_rgba(51,45,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary1/35 hover:shadow-[0_10px_22px_rgba(51,45,42,0.13)] active:scale-[0.99]"
    >
      <div className="relative m-2 mb-0 aspect-square w-[calc(100%-1rem)] overflow-hidden rounded-[1rem] bg-gray-100">
        <CardImage
          src={displayImage}
          alt={shelterAnimal?.desertionNo || t('유기동물 이미지', 'Shelter animal')}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
          unoptimized={shouldUseUnoptimizedImage}
          loading={priority ? undefined : 'lazy'}
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
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
              aria-label={t('공고 종료', 'Listing closed')}
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
          aria-label={isLiked ? t('찜 해제', 'Remove from saved') : t('찜하기', 'Save animal')}
          className={`absolute left-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-[#817873] shadow-sm backdrop-blur-sm transition hover:text-alert ${isUpdating || !desertionNo ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isLiked ? (
            <HiHeart className="h-4 w-4 text-alert" aria-hidden />
          ) : (
            <HiOutlineHeart className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <div className="flex min-w-0 items-start justify-between gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-sm font-extrabold text-[#332d2a]">
            {cardTitle}
          </h3>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-[#817873]">
          {summaryLabel}
        </p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-[#817873]">
          <MdLocationOn className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{locationLabel}</span>
        </p>
      </div>
    </article>
  );
}
