'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BannerImage from './BannerImage';

const AUTO_SCROLL_INTERVAL_MS = 5000;
const SCROLL_SYNC_THROTTLE_MS = 120;
const SCROLL_SETTLE_THRESHOLD_PX = 4;
const SCROLL_SETTLE_MAX_FRAMES = 120; // ~2초 후 강제 해제

/** scrollend 지원 시 사용, 미지원 시 rAF로 목표 위치 근접 시 해제 */
function releaseProgrammaticScrollWhenSettled(
    el: HTMLElement,
    targetLeft: number,
    programmaticRef: React.MutableRefObject<boolean>,
    releaseRafRef: React.MutableRefObject<number | null>
) {
    const release = () => {
        programmaticRef.current = false;
        if (releaseRafRef.current != null) {
            cancelAnimationFrame(releaseRafRef.current);
            releaseRafRef.current = null;
        }
    };

    if (typeof (el as HTMLElement & { onscrollend?: () => void }).onscrollend !== 'undefined') {
        el.addEventListener('scrollend', release, { once: true });
        return;
    }

    let frames = 0;
    const loop = () => {
        if (!el) return;
        const diff = Math.abs(el.scrollLeft - targetLeft);
        if (diff <= SCROLL_SETTLE_THRESHOLD_PX || frames >= SCROLL_SETTLE_MAX_FRAMES) {
            release();
            return;
        }
        frames += 1;
        releaseRafRef.current = requestAnimationFrame(loop);
    };
    releaseRafRef.current = requestAnimationFrame(loop);
}

export default function Banner() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const programmaticScrollRef = useRef(false);
    const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const releaseRafRef = useRef<number | null>(null);

    useEffect(() => {
        const el = scrollRef.current;
        const releaseRaf = releaseRafRef;
        if (!el) return;

        const intervalId = setInterval(() => {
            programmaticScrollRef.current = true;
            setCurrentIndex((prev) => {
                const next = prev + 1 >= 3 ? 0 : prev + 1;
                const container = scrollRef.current;
                if (container) {
                    const width = container.clientWidth;
                    const targetLeft = width * next;
                    container.scrollTo({ left: targetLeft, behavior: 'smooth' });
                    releaseProgrammaticScrollWhenSettled(container, targetLeft, programmaticScrollRef, releaseRafRef);
                }
                return next;
            });
        }, AUTO_SCROLL_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
            if (throttleRef.current) clearTimeout(throttleRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            const releaseRafId = releaseRaf.current;
            if (releaseRafId != null) cancelAnimationFrame(releaseRafId);
        };
    }, []);

    const syncIndexFromScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || programmaticScrollRef.current) return;
        const width = el.clientWidth;
        const index = Math.round(el.scrollLeft / width);
        setCurrentIndex(Math.min(index, 3));
    }, []);

    const handleScroll = useCallback(() => {
        if (programmaticScrollRef.current) return;
        if (throttleRef.current) return;
        throttleRef.current = setTimeout(() => {
            throttleRef.current = null;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                syncIndexFromScroll();
            });
        }, SCROLL_SYNC_THROTTLE_MS);
    }, [syncIndexFromScroll]);

    const goToSlide = useCallback((index: number) => {
        const el = scrollRef.current;
        if (!el) return;
        programmaticScrollRef.current = true;
        const width = el.clientWidth;
        const targetLeft = width * index;
        el.scrollTo({ left: targetLeft, behavior: 'smooth' });
        setCurrentIndex(index);
        releaseProgrammaticScrollWhenSettled(el, targetLeft, programmaticScrollRef, releaseRafRef);
    }, []);

    const goPrev = () => {
        const prev = currentIndex <= 0 ? 3 : currentIndex - 1;
        goToSlide(prev);
    };

    const goNext = () => {
        const next = currentIndex >= 3 ? 0 : currentIndex + 1;
        goToSlide(next);
    };

    const TOTAL_SLIDES = 4;

    return (
        <div className="mt-4 w-full max-w-6xl mx-auto px-4 sm:px-6" aria-label="배너 캐러셀">
            <div className="relative w-full overflow-hidden rounded-xl shadow-sm">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-xl scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    <div className="min-w-full w-full shrink-0 snap-center snap-always flex-[0_0_100%]">
                        <BannerImage imageUrl={'/static/images/shelter_banner.png'} link={'/animalShelter'} title={'보호소 정보 확인하기'} priority={true} />
                    </div>
                    <div className="min-w-full w-full shrink-0 snap-center snap-always flex-[0_0_100%]">
                        <BannerImage imageUrl={'/static/images/notice_banner.png'} link={'/notice'} title={'공지사항 보기'} />
                    </div>
                    <div className="min-w-full w-full shrink-0 snap-center snap-always flex-[0_0_100%]">
                        <BannerImage imageUrl={'/static/images/ai_banner.png'} link={'/search-animal'} title={'기능 사용해보기'} />
                    </div>
                    <div className="min-w-full w-full shrink-0 snap-center snap-always flex-[0_0_100%]">
                        <BannerImage
                            imageUrl={'/static/images/google_form.png'}
                            link={'https://docs.google.com/forms/d/e/1FAIpQLSe0EPUnUZbQzBSz9d3LXxnalra_3fGgflnBJTerlquCdbZOZA/viewform?usp=header'}
                            title={'꼬순내 서비스 평가 설문'}
                            openInNewTab
                        />
                    </div>
                </div>

                {/* 좌우 화살표 - 콘텐츠와 겹치지 않도록 여백 확보 */}
                <button
                    type="button"
                    onClick={goPrev}
                    aria-label="이전 배너"
                    className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition-all duration-200 hover:scale-110 hover:bg-primary1 hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary1/50 sm:left-4 sm:h-10 sm:w-10 md:left-5 md:h-11 md:w-11"
                >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={goNext}
                    aria-label="다음 배너"
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition-all duration-200 hover:scale-110 hover:bg-primary1 hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary1/50 sm:right-4 sm:h-10 sm:w-10 md:right-5 md:h-11 md:w-11"
                >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            {/* 인디케이터 */}
            <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="배너 슬라이드">
                {Array.from({ length: TOTAL_SLIDES }, (_, index) => (
                    <button
                        key={index}
                        type="button"
                        role="tab"
                        aria-selected={currentIndex === index}
                        aria-label={`배너 ${index + 1}로 이동`}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all ${currentIndex === index
                            ? 'w-6 bg-primary1'
                            : 'w-2 bg-gray-300 hover:bg-gray-400'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
