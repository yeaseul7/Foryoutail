'use client';

import Image from 'next/image';
import Link from 'next/link';

type BannerImageProps = {
    imageUrl: string;
    link: string;
    title: string;
    priority?: boolean;
    /**
     * true면 블러 배경을 CSS 그라디언트로 대체해 동일 이미지 2회 디코딩을 피합니다.
     * WebView/저사양 기기에서 프레임 드랍이 있을 때 사용 권장.
     */
    lightweightBlur?: boolean;
};

const SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px';

export default function BannerImage({ imageUrl, link, title, priority = false, lightweightBlur = false }: BannerImageProps) {
    return (
        <section
            className="relative flex w-full shrink-0 overflow-hidden rounded-2xl min-h-[160px] sm:min-h-[200px] md:min-h-[240px] lg:min-h-[293px]"
            aria-label={title}
        >
            {/* 여백(letterbox) 채움: lightweightBlur 시 그라디언트만 사용(디코딩 1회), 아니면 동일 이미지 블러 레이어(2회 디코딩) */}
            {lightweightBlur ? (
                <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300"
                    aria-hidden
                />
            ) : (
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
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
            {/* 선명한 이미지: contain으로 전체 노출 */}
            <div className="absolute inset-0 rounded-2xl">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes={SIZES}
                    className="object-contain object-center"
                    priority={priority}
                    loading={priority ? undefined : 'lazy'}
                />
            </div>
            <Link
                href={link}
                className="absolute inset-0 z-10"
                aria-label={title}
            />
        </section>
    );
}
