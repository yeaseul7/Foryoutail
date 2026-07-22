import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import ShelterPostsClient from '@/packages/components/shelter/ShelterPostsClient';
import AbandonedCardSkeleton from '@/packages/components/skeleton/AbandonedCardSkeleton';
import { generateDefaultMetadata } from '@/packages/utils/metadata';

export const metadata: Metadata = generateDefaultMetadata(
  '전국 유기동물 입양 공고',
  '전국 유기견·유기묘 입양 공고를 지역과 상태별로 확인하고, 가족을 기다리는 아이들을 포유테일에서 찾아보세요.',
  'https://www.kkosunnae.com/shelter',
  {
    includeCanonical: true,
  },
);

function ShelterPostsFallback() {
  return (
    <div
      className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 justify-items-stretch gap-4 px-0 py-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="min-w-0">
          <AbandonedCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export default function Shelter() {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <Suspense fallback={<ShelterPostsFallback />}>
          <ShelterPostsClient initialData={{ items: [], hasMore: true }} />
        </Suspense>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
