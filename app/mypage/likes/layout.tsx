import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { generateDefaultMetadata } from '@/packages/utils/metadata';

const baseMetadata = generateDefaultMetadata(
  '찜한 동물',
  '꼬순내에서 찜한 유기동물 공고를 확인하세요.',
  'https://www.kkosunnae.com/mypage/likes',
);

export const metadata: Metadata = {
  ...baseMetadata,
  robots: { index: false, follow: false },
};

export default function LikedAnimalsLayout({ children }: { children: ReactNode }) {
  return children;
}
