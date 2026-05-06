import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { generateDefaultMetadata } from '@/packages/utils/metadata';

export const metadata: Metadata = generateDefaultMetadata(
  '입양 후기·반려동물 커뮤니티',
  '입양 후기와 반려 생활 이야기를 나누고, 유기동물 입양 경험과 정보를 함께 공유하는 포유테일 커뮤니티입니다.',
  'https://www.kkosunnae.com/community',
  {
    includeCanonical: true,
  },
);

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
