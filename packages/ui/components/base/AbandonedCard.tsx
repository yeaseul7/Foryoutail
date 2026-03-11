'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useMemo, useCallback } from 'react';
import { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import { HiCalendar, HiClock } from 'react-icons/hi2';

export default function AbandonedCard({
  shelterAnimal,
}: {
  shelterAnimal: ShelterAnimalItem;
}) {
  const router = useRouter();
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
    return currentImageUrl;
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

  const isExternalImage = useMemo(() => {
    if (!currentImageUrl) return false;
    if (currentImageUrl.includes('res.cloudinary.com')) return true;
    if (currentImageUrl.includes('openapi.animal.go.kr') || currentImageUrl.includes('www.animal.go.kr')) {
      return false;
    }
    if (displayImage === defaultImage) return true;
    return false;
  }, [currentImageUrl, displayImage, defaultImage]);

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

    // 보호중이고 남은 일수가 0 이상일 때 D-n (빨간 뱃지), 그 외에는 공고 종료 (회색)
    const isProtecting = shelterAnimal?.processState === '보호중';
    if (isProtecting && diffDays >= 0) {
      return {
        text: `D-${diffDays}`,
        bgColor: '#e54c41', // 빨간 배경 (디데이 뱃지)
        textColor: '#ffffff', // 흰색 텍스트·아이콘
      };
    }
    return {
      text: '공고 종료',
      bgColor: '#E5E5E5', // 연한 회색
      textColor: '#6B6B6B', // 어두운 회색 텍스트
    };
  }, [shelterAnimal]);

  const basicInfoLine = useMemo(() => {
    const parts: string[] = [];
    if (shelterAnimal.kindNm) parts.push(shelterAnimal.kindNm);
    if (shelterAnimal.age) parts.push(shelterAnimal.age.includes('살') ? shelterAnimal.age : `${shelterAnimal.age}살`);
    if (shelterAnimal.sexCd) parts.push(shelterAnimal.sexCd === 'M' ? '수컷' : shelterAnimal.sexCd === 'F' ? '암컷' : shelterAnimal.sexCd);
    return parts.join(' · ');
  }, [shelterAnimal.kindNm, shelterAnimal.age, shelterAnimal.sexCd]);

  const rescueDateStr = useMemo(() => {
    const dt = shelterAnimal.happenDt;
    if (!dt || dt.length < 8) return '';
    return `${dt.substring(0, 4)}.${dt.substring(4, 6)}.${dt.substring(6, 8)} 구조`;
  }, [shelterAnimal.happenDt]);

  return (
    <article
      key={shelterAnimal.desertionNo}
      onClick={() => router.push(`/shelter/${shelterAnimal.desertionNo}`)}
      className=" p-2 sm:p-3 flex overflow-hidden flex-col bg-white rounded-2xl shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] w-full max-w-full sm:max-w-[260px] border border-gray-100"
    >
      <div className="relative w-full bg-gray-100 aspect-square overflow-hidden rounded-2xl">
        <Image
          src={displayImage}
          alt={shelterAnimal?.desertionNo || '유기동물 이미지'}
          fill
          className="object-contain "
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
          unoptimized={
            isExternalImage || displayImage === defaultImage || undefined
          }
          loading="lazy"
          onError={handleImageError}
        />
        {/* 뱃지: 사진 오른쪽 상단 - D-n(빨강+시계) 또는 공고 종료. 화면 크기에 맞춰 반응형 */}
        {noticeEndBadge && (
          <div
            className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap shadow-sm min-w-0"
            style={{
              backgroundColor: noticeEndBadge.bgColor,
              color: noticeEndBadge.textColor,
            }}
          >
            {noticeEndBadge.text.startsWith('D-') && (
              <HiClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden />
            )}
            <span>{noticeEndBadge.text}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 pt-3 sm:pt-4 gap-3 relative ">
        {/* 이름 + 보호중 뱃지 */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate flex-1 min-w-0">
            {shelterAnimal?.kindNm || '이름 없음'}
          </h3>
          {shelterAnimal?.processState && (
            <div
              className="flex-shrink-0 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold whitespace-nowrap min-w-0"
              style={{
                backgroundColor: statusBadge.bgColor,
                color: statusBadge.textColor,
              }}
            >
              {statusBadge.text}
            </div>
          )}
        </div>
        {/* 품종 · 나이 · 성별 */}
        {basicInfoLine && (
          <p className="text-xs text-gray-700">
            {basicInfoLine}
          </p>
        )}
        {/* 구조일 */}
        {rescueDateStr && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <HiCalendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>{rescueDateStr}</span>
          </div>
        )}
        {/* 자세히 보기 버튼 - 항상 노출, 보라 톤 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/shelter/${shelterAnimal.desertionNo}`);
          }}
          className="w-full flex justify-center items-center py-1.5 rounded-2xl text-xs font-semibold transition-colors mt-2 bg-primary1/10 text-primary1 hover:bg-primary1/20"
        >
          자세히 보기
        </button>
      </div>
    </article>
  );
}
