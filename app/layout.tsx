import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import '@/styles/keyframe.css';
import Providers from './providers';
import { getBaseUrl } from '@/packages/utils/metadata';

const pretendard = localFont({
  src: '../public/static/font/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
  style: 'normal',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

const siteUrl = getBaseUrl().replace(/\/$/, '');
const siteTitle = 'matchichi | 전국 유기동물 입양 공고·보호소 찾기';
const siteDescription = '전국 유기견·유기묘와 기타 유기동물의 최신 입양 공고를 지역, 기간, 상태별로 검색하고 가까운 동물보호소 정보를 확인하세요.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'matchichi',
  title: {
    template: '%s | matchichi',
    default: siteTitle,
  },
  description: siteDescription,
  authors: [{ name: 'matchichi', url: siteUrl }],
  creator: 'matchichi',
  publisher: 'matchichi',
  category: '반려동물 입양',
  classification: '유기동물 입양 정보 서비스',
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: '/',
  },
  keywords: [
    'matchichi',
    '유기동물 입양',
    '유기견 입양',
    '유기묘 입양',
    '유기동물 공고',
    '유기견 공고',
    '유기묘 공고',
    '유기동물 보호소',
    '동물보호소',
    '보호소 찾기',
    '강아지 입양',
    '고양이 입양',
    '유기동물 AI 검색',
    '유기동물 정보',
  ],
  icons: {
    icon: '/static/images/findme-app-icon.png',
    shortcut: '/static/images/findme-app-icon.png',
    apple: '/static/images/findme-app-icon.png',
  },
  verification: {
    google: 'WBwV06sSdVI6wLAiXlN3T32MSQlsqxdSv49eMBt7JWs',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'matchichi',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/static/images/matchichi-social.png`,
        width: 1731,
        height: 909,
        alt: 'matchichi - 유기동물 입양 공고와 AI 검색',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/static/images/matchichi-social.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport = {
  themeColor: '#F45F4A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${siteUrl}/#organization`,
                  name: 'matchichi',
                  url: siteUrl,
                  logo: `${siteUrl}/static/images/matchichi-logo.png`,
                  sameAs: ['https://www.instagram.com/earlys_day/'],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${siteUrl}/#website`,
                  url: siteUrl,
                  name: 'matchichi',
                  alternateName: ['마치치', '전국 유기동물 입양 공고'],
                  description: siteDescription,
                  inLanguage: ['ko-KR', 'en'],
                  publisher: { '@id': `${siteUrl}/#organization` },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${siteUrl}/?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'WebApplication',
                  '@id': `${siteUrl}/#application`,
                  name: 'matchichi',
                  url: siteUrl,
                  applicationCategory: 'LifestyleApplication',
                  operatingSystem: 'Web',
                  description: siteDescription,
                  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
                },
              ],
            }).replace(/</g, '\\u003c'),
          }}
        />
        <meta name="google-adsense-account" content="ca-pub-6471129158350904" />
        <meta
          name="naver-site-verification"
          content="c61009c06bdc1e6acd5ec9f6813edbf6b52524c8"
        />
      </head>
      <body
        className={`${pretendard.variable} min-h-screen w-full bg-background font-sans text-text1 antialiased`}
      >
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6471129158350904"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9P3M59NTFM"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9P3M59NTFM');
          `}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
