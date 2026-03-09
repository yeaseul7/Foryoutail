'use client';

import Image from 'next/image';
import Link from 'next/link';

type BannerImageProps = {
    imageUrl: string;
    link: string;
    title: string;
    priority?: boolean;
    /**
     * true면 블러 배경 대신 그라디언트 사용(깔끔한 노출, 디코딩 1회).
     * false면 블러 배경 레이어 사용(letterbox 여백 채움).
     */
    lightweightBlur?: boolean;
    /** true면 새 창에서 열기 (target="_blank") */
    openInNewTab?: boolean;
};

const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px';

/** 배너: 2000x300 비율(20:3). 컨테이너와 이미지 비율을 맞춰 공백 없음 */
const BANNER_ASPECT = 'aspect-[20/3]';

export default function BannerImage({ imageUrl, link, title, priority = false, lightweightBlur = true, openInNewTab = false }: BannerImageProps) {
    return (
        <section
            className={`relative flex w-full shrink-0 overflow-hidden rounded-xl ${BANNER_ASPECT} bg-gray-100`}
            aria-label={title}
        >
            {/* 배경: 블러 없이 그라디언트만 사용해 선명하게 (기본값) */}
            {lightweightBlur ? (
                <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300"
                    aria-hidden
                />
            ) : (
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes={SIZES}
                        className="object-cover object-center scale-[1.15]"
                        style={{ filter: 'blur(20px)' }}
                        priority={priority}
                        loading={priority ? undefined : 'lazy'}
                    />
                </div>
            )}
            {/* 영역을 꽉 채워 위아래 회색 공백 없음 (object-cover) */}
            <div className="absolute inset-0 rounded-xl">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes={SIZES}
                    className="object-cover object-center"
                    priority={priority}
                    loading={priority ? undefined : 'lazy'}
                />
            </div>
            {openInNewTab ? (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10"
                    aria-label={title}
                />
            ) : (
                <Link
                    href={link}
                    className="absolute inset-0 z-10"
                    aria-label={title}
                />
            )}
        </section>
    );
}
