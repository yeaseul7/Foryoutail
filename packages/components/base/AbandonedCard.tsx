'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { ShelterAnimalItem } from '@/packages/type/postType';
import {
  normalizeAnimalImageUrl,
  shouldBypassNextImageOptimization,
} from '@/packages/utils/imageSource';
import {
  HiHeart,
  HiOutlineHeart,
} from 'react-icons/hi2';
import { FaPaw } from 'react-icons/fa';
import { useShelterLike } from '@/hooks/useShelterLike';
import CardImage from '@/packages/components/common/CardImage';
import { useLanguage } from '@/lib/i18n/language';
import { animalBreedLabel, animalColorLabel, animalNoteLabel } from '@/lib/i18n/animal-labels';

export default function AbandonedCard({
  shelterAnimal,
  priority = false,
  aiResult = false,
  hideShelterInfo = false,
  spacious = false,
}: {
  shelterAnimal: ShelterAnimalItem;
  priority?: boolean;
  aiResult?: boolean;
  hideShelterInfo?: boolean;
  spacious?: boolean;
}) {
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
    return normalizeAnimalImageUrl(currentImageUrl);
  }, [currentImageUrl]);

  const defaultImage = useMemo(() => {
    const species = `${shelterAnimal.upKindCd || ''} ${shelterAnimal.upKindNm || ''}`.toLowerCase();
    if (species.includes('422400') || species.includes('고양이') || species.includes('cat')) {
      return '/static/images/defaultCat.png';
    }
    if (species.includes('429900') || species.includes('기타') || species.includes('other')) {
      return '/static/images/defaultOtherAnimals.png';
    }
    return '/static/images/defaultDog.png';
  }, [shelterAnimal.upKindCd, shelterAnimal.upKindNm]);

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

  const isProtected = useMemo(() => {
    const state = shelterAnimal.processState?.trim().toLowerCase();
    return state === 'protect' || state === '보호중';
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

  const aiLocationLabel = useMemo(
    () => shelterAnimal.orgNm?.trim() || shelterAnimal.careAddr?.trim() || shelterAnimal.happenPlace?.trim() || locationLabel,
    [locationLabel, shelterAnimal.careAddr, shelterAnimal.happenPlace, shelterAnimal.orgNm],
  );

  const similarityLabel = useMemo(() => {
    const score = shelterAnimal.aiSimilarityScore;
    if (typeof score !== 'number' || !Number.isFinite(score)) return '-';
    const percentage = score <= 1 ? score * 100 : score;
    return `${Math.max(0, Math.min(100, Math.round(percentage)))}%`;
  }, [shelterAnimal.aiSimilarityScore]);

  return (
    <article
      className="relative flex h-full w-full max-w-full cursor-pointer flex-col overflow-hidden rounded-[14px] border border-[#eadfd7] bg-white shadow-[0_3px_10px_rgba(51,45,42,0.07)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary1/35 hover:shadow-[0_10px_22px_rgba(51,45,42,0.13)] active:scale-[0.99] sm:rounded-[20px]"
    >
      <Link
        href={`/${shelterAnimal.desertionNo}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('동물 상세 정보 새 창에서 보기', 'Open animal details in a new tab')}
        className="absolute inset-0 z-10 rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1 focus-visible:ring-inset sm:rounded-[20px]"
      />
      <div className="relative m-1.5 mb-0 aspect-[4/3] w-[calc(100%-0.75rem)] overflow-hidden rounded-[10px] bg-gray-100 sm:m-2 sm:mb-0 sm:w-[calc(100%-1rem)] sm:rounded-[1rem]">
        <CardImage
          src={displayImage}
          alt={shelterAnimal?.desertionNo || t('유기동물 이미지', 'Shelter animal')}
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={shouldUseUnoptimizedImage}
          loading={priority ? undefined : 'lazy'}
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          fallbackSrc={defaultImage}
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
          <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 sm:left-2 sm:top-2">
            {isProtected ? (
              <span
                className="block h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_1px_5px_rgba(34,197,94,0.5)] ring-2 ring-white sm:h-3 sm:w-3"
                role="img"
                aria-label={t('보호중', 'In protection')}
              />
            ) : (
              <div
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-white/80 px-2 py-0.5 text-[9px] font-bold shadow-[0_2px_8px_rgba(199,71,54,0.18)] sm:px-2.5 sm:py-1 sm:text-[11px]"
                style={{
                  backgroundColor: statusBadge.bgColor,
                  color: statusBadge.textColor,
                }}
              >
                {!isProcessEnded && <FaPaw className="h-2.5 w-2.5 rotate-[-12deg] sm:h-3 sm:w-3" aria-hidden />}
                {statusBadge.text}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`relative flex flex-1 flex-col ${spacious ? 'px-2.5 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3.5' : 'px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-2.5'}`}>
        {!aiResult && <button
          type="button"
          onClick={(event) => void handleLike(event)}
          disabled={isUpdating || !desertionNo}
          aria-label={isLiked ? t('찜 해제', 'Remove from saved') : t('찜하기', 'Save animal')}
          className={`absolute right-1.5 top-1.5 z-20 rounded-full bg-white p-1 text-[#817873] shadow-sm transition hover:bg-primary-soft hover:text-alert sm:right-2 sm:top-2 sm:p-1.5 ${isUpdating || !desertionNo ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isLiked ? (
            <HiHeart className="h-3.5 w-3.5 text-alert sm:h-4 sm:w-4" aria-hidden />
          ) : (
            <HiOutlineHeart className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          )}
        </button>}
        {aiResult ? (
          <div className="flex min-w-0 items-center justify-between gap-2 border-t border-[#eee7e2] pt-2">
            <p className="flex min-w-0 items-center gap-0.5 text-[9px] text-[#817873] sm:gap-1 sm:text-[11px]">
              <Image
                src="/static/images/findme-shelter-icon.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 object-contain"
              />
              <span className="truncate">{aiLocationLabel}</span>
            </p>
            <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[9px] font-bold text-primary1 sm:px-2.5 sm:text-[11px]">
              {t('유사도', 'Similarity')} {similarityLabel}
            </span>
          </div>
        ) : <>
        <div className="flex min-w-0 items-start justify-between gap-1.5 pr-7 sm:pr-8">
          <h3 className="min-w-0 flex-1 truncate text-xs font-extrabold text-[#332d2a] sm:text-sm">
            {cardTitle}
          </h3>
        </div>
        <p className="mt-0.5 truncate text-[10px] font-medium text-[#817873] sm:mt-1 sm:text-xs">
          {summaryLabel}
        </p>
        {!hideShelterInfo && <p className="mt-2 flex min-w-0 items-center gap-1 border-t border-[#eee7e2] pt-2 text-[9px] text-[#817873] sm:gap-1.5 sm:text-[11px]">
          <Image
            src="/static/images/findme-shelter-icon.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 object-contain"
          />
          <span className="truncate">{locationLabel}</span>
        </p>}
        </>}
      </div>
    </article>
  );
}
