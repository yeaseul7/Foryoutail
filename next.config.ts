import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // OpenNext/Cloudflare 빌드에서도 브라우저 번들에 공개 Supabase 설정을
  // 확실히 인라인합니다. 두 값은 클라이언트 공개용이며 비밀 키가 아닙니다.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      '',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    qualities: [70, 75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'www.animal.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.animal.go.kr',
      },
      {
        protocol: 'http',
        hostname: 'openapi.animal.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'openapi.animal.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'uqaaeqpdcezjpqtbybnm.supabase.co',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24,
  },
  experimental: {
    optimizePackageImports: [
      'react-icons',
    ],
  },
};

export default withBundleAnalyzer(nextConfig);

if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}
