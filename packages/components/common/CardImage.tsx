'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  unoptimized?: boolean;
  loading?: 'eager' | 'lazy';
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  quality?: number;
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK_SRC = '/static/images/notfound_img.png';

export default function CardImage({
  src,
  alt,
  className,
  sizes,
  unoptimized,
  loading,
  priority,
  fetchPriority,
  quality,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
}: CardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      {(!isLoaded || hasError) && (
        <Image
          src={fallbackSrc}
          alt=""
          fill
          aria-hidden
          className={className}
          sizes={sizes}
          priority={priority}
        />
      )}
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          fill
          className={`${className || ''} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`.trim()}
          sizes={sizes}
          unoptimized={unoptimized}
          loading={loading}
          priority={priority}
          fetchPriority={fetchPriority}
          quality={quality}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </>
  );
}
