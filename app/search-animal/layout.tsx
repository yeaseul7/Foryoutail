import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { generateDefaultMetadata } from '@/packages/utils/metadata';

export const metadata: Metadata = generateDefaultMetadata(
  '사진으로 비슷한 유기동물 찾기 AI',
  '사진 한 장으로 비슷한 유기동물 공고를 찾고, 최근 업데이트된 보호소 데이터를 바탕으로 닮은 아이를 포유테일에서 확인해보세요.',
  'https://www.kkosunnae.com/search-animal',
  {
    includeCanonical: true,
  },
);

export default function SearchAnimalLayout({ children }: { children: ReactNode }) {
  return children;
}
