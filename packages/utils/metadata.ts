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
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3001';
}



function isUnsupportedImageUrl(imageUrl: string): boolean {
  if (imageUrl.startsWith('http://')) {
    return true;
  }

  if (imageUrl.includes('openapi.animal.go.kr')) {
    return true;
  }

  return false;
}

export function normalizeImageUrl(
  imageUrl: string | null | undefined,
  baseUrl: string,
  defaultImagePath: string = '/static/images/defaultDog.png',
): string {
  if (!imageUrl) {
    return `${baseUrl}${defaultImagePath}`;
  }

  if (isUnsupportedImageUrl(imageUrl)) {
    return `${baseUrl}${defaultImagePath}`;
  }

  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }

  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://')) {
    return imageUrl.replace('http://', 'https://');
  }

  return `${baseUrl}/${imageUrl}`;
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
}


export function generateMetadata(options: GenerateMetadataOptions): Metadata {
  const {
    title,
    description,
    imageUrl,
    url,
    type = 'website',
    siteName = '포유테일',
    locale = 'ko_KR',
    defaultImagePath = '/static/images/defaultDog.png',
    includeCanonical = true, // 기본값을 true로 추천 (SEO 중복 방지)
    includeTwitterCreator = false,
    imageAlt,
  } = options;

  const baseUrl = getBaseUrl();
  const normalizedImageUrl = normalizeImageUrl(imageUrl, baseUrl, defaultImagePath);
  const imageAltText = imageAlt || `${title} - 포유테일`;

  // 160자 제한으로 설명문 최적화
  const truncatedDescription = extractText(description)?.substring(0, 160) || '';

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
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
          width: 1200,
          height: 630,
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
  },
): Metadata {
  const {
    type = 'website',
    defaultImagePath = '/static/images/defaultDog.png',
    includeCanonical = false,
    includeTwitterCreator = false,
  } = options || {};

  return generateMetadata({
    title: defaultTitle,
    description: defaultDescription,
    url,
    type,
    defaultImagePath,
    includeCanonical,
    includeTwitterCreator,
    imageAlt: '포유테일',
  });
}

