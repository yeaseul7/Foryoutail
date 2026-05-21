import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import '@/styles/keyframe.css';
import Providers from './providers';

const cafe24SsurroundAir = localFont({
  src: '../public/static/font/Cafe24SsurroundAir-v1.1/webfont/Cafe24SsurroundAir-v1.1.woff2',
  variable: '--font-cafe24',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: {
    template: '%s | 포유테일',
    default: '포유테일 - 가족을 기다리는 따뜻한 발걸음, 유기동물 입양 커뮤니티',
  },
  description:
    '포유테일에서 전국 유기견·유기묘 입양 공고와 유기동물 보호소 정보를 확인하고, 반려동물 커뮤니티에서 입양 후기와 반려 생활 이야기를 나눠보세요.',
  keywords: [
    '포유테일',
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
    '반려동물 커뮤니티',
    '반려견 커뮤니티',
    '반려묘 커뮤니티',
    '입양 후기',
    '유기동물 정보',
  ],
  icons: {
    icon: '/static/images/foryoutail.png',
    apple: '/static/images/foryoutail.png',
  },
  verification: {
    google: 'WBwV06sSdVI6wLAiXlN3T32MSQlsqxdSv49eMBt7JWs',
  },
  openGraph: {
    title: '유기동물 입양 공고·보호소 찾기·반려동물 커뮤니티 | 포유테일',
    description:
      '전국 유기견·유기묘 공고, 유기동물 보호소 정보, 입양 후기와 반려동물 커뮤니티를 포유테일에서 한곳에 확인해보세요.',
    url: 'https://kkosunnae.com',
    siteName: '포유테일',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: 'https://kkosunnae.com/static/images/metabanner.png',
        width: 1200,
        height: 630,
        alt: '포유테일 - 유기동물 입양 공고, 보호소 찾기, 반려동물 커뮤니티',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '유기동물 입양 공고·보호소 찾기·반려동물 커뮤니티 | 포유테일',
    description:
      '전국 유기동물 공고와 보호소 정보를 찾고, 반려인 커뮤니티에서 입양 후기와 반려 생활 이야기를 나눠보세요.',
    images: ['https://kkosunnae.com/static/images/metabanner.png'],
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
  themeColor: '#FFD700',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6471129158350904" />
        <meta
          name="naver-site-verification"
          content="c61009c06bdc1e6acd5ec9f6813edbf6b52524c8"
        />
      </head>
      <body
        className={`${cafe24SsurroundAir.variable} antialiased w-full min-h-screen font-sans bg-white`}
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
