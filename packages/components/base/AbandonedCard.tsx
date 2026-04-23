'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';
import { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import {
  normalizeAnimalImageUrl,
  shouldBypassNextImageOptimization,
} from '@/packages/utils/imageSource';
import {
  HiCalendar,
  HiCalendarDays,
  HiClock,
  HiHeart,
  HiOutlineHeart,
  HiQuestionMarkCircle,
} from 'react-icons/hi2';
import { FaMars, FaPaw, FaVenus } from 'react-icons/fa';
import { useShelterLike } from '@/hooks/useShelterLike';

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

  const handleImageError = useCallback(() => {
    if (currentImageIndex < availableImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  }, [currentImageIndex, availableImages.length]);

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

  /** D-n은 공고 종료까지 7일 이하일 때만 표시. 그 외(보호중이나 8일 이상 남음)는 null */
  const noticeEndBadge = useMemo(() => {
    if (!shelterAnimal?.noticeEdt) return null;

    const noticeEdtStr = shelterAnimal.noticeEdt;
    const year = parseInt(noticeEdtStr.substring(0, 4));
    const month = parseInt(noticeEdtStr.substring(4, 6)) - 1;
    const day = parseInt(noticeEdtStr.substring(6, 8));
    const endDate = new Date(year, month, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isProtecting = shelterAnimal?.processState === '보호중';
    if (isProtecting && diffDays >= 0 && diffDays <= 7) {
      return {
        text: `D-${diffDays}`,
        bgColor: '#e54c41',
        textColor: '#ffffff',
      };
    }
    if (isProtecting && diffDays > 7) {
      return null;
    }
    return {
      text: '공고 종료',
      bgColor: '#E5E5E5',
      textColor: '#6B6B6B',
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

  const rescueDateStr = useMemo(() => {
    const dt = shelterAnimal.happenDt;
    if (!dt || dt.length < 8) return '';
    return `${dt.substring(0, 4)}.${dt.substring(4, 6)}.${dt.substring(6, 8)} 구조`;
  }, [shelterAnimal.happenDt]);

  return (
    <article
      key={shelterAnimal.desertionNo}
      onClick={() => router.push(`/shelter/${shelterAnimal.desertionNo}`)}
      className="flex h-full w-full max-w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 border-b-0 bg-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-gray-100">
        <Image
          src={displayImage}
          alt={shelterAnimal?.desertionNo || '유기동물 이미지'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
          unoptimized={shouldUseUnoptimizedImage}
          loading="lazy"
          onError={handleImageError}
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
        {/* 사진 오른쪽 상단: D-n(7일 이하만) 또는 공고 종료 → 그 오른쪽에 processState 뱃지 */}
        {(noticeEndBadge || shelterAnimal?.processState) && (
          <div className="absolute top-1 right-1 z-10 flex max-w-[calc(100%-0.5rem)] flex-row items-center justify-end gap-1 sm:top-1.5 sm:right-1.5 sm:gap-1.5">
            {noticeEndBadge && (
              <div
                className="flex min-w-0 shrink items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs whitespace-nowrap"
                style={{
                  backgroundColor: noticeEndBadge.bgColor,
                  color: noticeEndBadge.textColor,
                }}
              >
                {noticeEndBadge.text.startsWith('D-') && (
                  <HiClock className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden />
                )}
                <span>{noticeEndBadge.text}</span>
              </div>
            )}
            {shelterAnimal?.processState && (
              <div
                className="min-w-0 shrink rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-xs"
                style={{
                  backgroundColor: statusBadge.bgColor,
                  color: statusBadge.textColor,
                }}
              >
                {statusBadge.text}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative flex flex-1 flex-col gap-2 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        {/* 특징(specialMark) + 찜 — 상태 뱃지는 사진 영역 상단 */}
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900 sm:text-base">
            {headlineSpecialMark}
          </h3>
          <button
            type="button"
            onClick={(e) => void handleLike(e)}
            disabled={isUpdating || !desertionNo}
            aria-label={isLiked ? '찜 해제' : '찜하기'}
            className={`shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1/30 ${isUpdating || !desertionNo ? 'cursor-not-allowed opacity-50' : ''
              }`}
          >
            {isLiked ? (
              <HiHeart className="h-5 w-5 text-red-500" aria-hidden />
            ) : (
              <HiOutlineHeart className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
        {/* 생년월일 → 성별 → 구조일 (위에서 아래로 세로 나열) */}
        {(ageLabel || sexLabel || rescueDateStr) && (
          <ul
            className="flex min-w-0 list-none flex-col gap-1.5 p-0"
            aria-label="생년월일·성별·구조일"
          >
            <li className="flex min-w-0 flex-col gap-1">
              <div className="flex min-w-0 items-center gap-2">
                <HiCalendarDays
                  className="h-5 w-5 shrink-0 text-gray-400"
                  aria-hidden
                />
                <span className="min-w-0 truncate text-sm text-gray-700">
                  {ageLabel || '—'}
                </span>
              </div>
            </li>
            <li className="flex min-w-0 flex-col gap-1">
              <div className="flex min-w-0 items-center gap-2">
                {shelterAnimal.sexCd === 'M' ? (
                  <FaMars className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />
                ) : shelterAnimal.sexCd === 'F' ? (
                  <FaVenus className="h-5 w-5 shrink-0 text-rose-500" aria-hidden />
                ) : (
                  <HiQuestionMarkCircle
                    className="h-5 w-5 shrink-0 text-gray-400"
                    aria-hidden
                  />
                )}
                <span className="min-w-0 truncate text-sm text-gray-700">
                  {sexLabel || '—'}
                </span>
              </div>
            </li>
            <li className="flex min-w-0 flex-col gap-1">
              <div className="flex min-w-0 items-center gap-2">
                <HiCalendar className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                <span className="min-w-0 truncate text-sm text-gray-700">
                  {rescueDateStr || '—'}
                </span>
              </div>
            </li>
          </ul>
        )}
        {/* 자세히 보기 버튼 - 항상 노출, 보라 톤 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/shelter/${shelterAnimal.desertionNo}`);
          }}
          className="flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:py-2.5 bg-primary1/10 text-primary1 hover:bg-primary1/20"
        >
          자세히 보기
        </button>
      </div>
    </article>
  );
}
