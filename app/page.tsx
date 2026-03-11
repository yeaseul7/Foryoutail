'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HorizontalAnimalCardSkeleton from '@/packages/ui/components/base/HorizontalAnimalCardSkeleton';

const PageTemplate = dynamic(
  () => import('@/packages/ui/components/base/PageTemplate'),
  { ssr: true }
);

const PageFooter = dynamic(
  () => import('@/packages/ui/components/base/PageFooter'),
  { ssr: true }
);



const SummaryCardNews = dynamic(
  () => import('@/packages/ui/components/home/SummaryCardNews'),
  { ssr: true }
);

const HorizontalAnimalList = dynamic(
  () => import('@/packages/ui/components/home/shelter/HorizontalAnimalList'),
  { ssr: true }
);
const Banner = dynamic(
  () => import('@/packages/ui/components/home/Banner'),
  { ssr: true }
);

export default function Home() {
  return (
    <main className="page-container-full">
      <PageTemplate visibleHomeTab={false}>
        <div className="w-full">

          <Suspense fallback={
            <section className="w-full py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <span className="h-5 w-0.5 shrink-0 rounded-full bg-primary1" aria-hidden />
                최근 입양 공고
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="snap-center">
                    <HorizontalAnimalCardSkeleton />
                  </div>
                ))}
              </div>
            </section>
          }>
            <HorizontalAnimalList />
          </Suspense>
        </div>
        <Banner />
        <Suspense fallback={
          <div className="w-full px-4 pt-8 sm:px-0 sm:pt-10">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          </div>
        }>
          <div className="w-full pt-8 sm:pt-10 mb-10">
            <SummaryCardNews />
          </div>
        </Suspense>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
