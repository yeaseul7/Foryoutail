import { Metadata } from 'next';

/**
 * HTML에서 텍스트를 추출합니다.
 */
export function extractText(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * HTML에서 첫 번째 이미지 URL을 추출합니다.
 */
export function extractFirstImage(html: string | undefined): string | null {
  if (!html || typeof html !== 'string') {
    return null;
  }
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = html.match(imgRegex);
  return match && match[1] ? match[1] : null;
}

/**
 * baseUrl을 가져옵니다.
 * 환경 변수 우선순위: NEXT_PUBLIC_BASE_URL > VERCEL_URL > localhost
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://www.kkosunnae.com'
    : 'http://localhost:3003';
}


export function normalizeImageUrl(
  imageUrl: string | null | undefined,
  baseUrl: string,
  defaultImagePath: string = '/static/images/matchichi-social.png',
): string {
  if (!imageUrl) {
    return `${baseUrl}${defaultImagePath}`;
  }

  const safeImageUrl = imageUrl.startsWith('http://')
    ? imageUrl.replace('http://', 'https://')
    : imageUrl;

  if (safeImageUrl.startsWith('/')) {
    return `${baseUrl}${safeImageUrl}`;
  }

  if (safeImageUrl.startsWith('https://')) {
    return safeImageUrl;
  }

  return `${baseUrl}/${safeImageUrl}`;
}


export interface GenerateMetadataOptions {
  title: string;
  description: string;
  imageUrl?: string | null;
  url: string;
  type?: 'website' | 'article';
  siteName?: string;
  locale?: string;
  defaultImagePath?: string;
  includeCanonical?: boolean;
  includeTwitterCreator?: boolean;
  includeOtherOgTags?: boolean;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}


export function generateMetadata(options: GenerateMetadataOptions): Metadata {
  const {
    title,
    description,
    imageUrl,
    url,
    type = 'website',
    siteName = 'matchichi',
    locale = 'ko_KR',
    defaultImagePath = '/static/images/matchichi-social.png',
    includeCanonical = true, // 기본값을 true로 추천 (SEO 중복 방지)
    includeTwitterCreator = false,
    imageAlt,
    imageWidth = 1200,
    imageHeight = 630,
  } = options;

  const baseUrl = getBaseUrl();
  const normalizedImageUrl = normalizeImageUrl(imageUrl, baseUrl, defaultImagePath);
  const imageAltText = imageAlt || `${title} - matchichi`;

  // 160자 제한으로 설명문 최적화
  const truncatedDescription = extractText(description)?.substring(0, 160) || '';

  return {
    // 루트 layout의 title template과 중복으로 서비스명이 붙지 않도록 한다.
    title: { absolute: `${title} | ${siteName}` },
    description: truncatedDescription,
    metadataBase: new URL(baseUrl),
    alternates: includeCanonical ? { canonical: url } : undefined,
    openGraph: {
      title,
      description: truncatedDescription,
      url,
      siteName,
      images: [
        {
          url: normalizedImageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAltText,
        },
      ],
      locale,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: truncatedDescription,
      images: [normalizedImageUrl],
      creator: includeTwitterCreator ? '@kkosunnae' : undefined,
    },
    // 로봇 제어 (필요 시 추가)
    robots: {
      index: true,
      follow: true,
    },
  };
}


export function generateDefaultMetadata(
  defaultTitle: string,
  defaultDescription: string,
  url: string,
  options?: {
    type?: 'website' | 'article';
    defaultImagePath?: string;
    includeCanonical?: boolean;
    includeTwitterCreator?: boolean;
    imageWidth?: number;
    imageHeight?: number;
  },
): Metadata {
  const {
    type = 'website',
    defaultImagePath = '/static/images/matchichi-social.png',
    includeCanonical = true,
    includeTwitterCreator = false,
    imageWidth = 1200,
    imageHeight = 630,
  } = options || {};

  return generateMetadata({
    title: defaultTitle,
    description: defaultDescription,
    url,
    type,
    defaultImagePath,
    includeCanonical,
    includeTwitterCreator,
    imageAlt: 'matchichi',
    imageWidth,
    imageHeight,
  });
}
