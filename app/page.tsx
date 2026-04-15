'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HorizontalAnimalCardSkeleton from '@/packages/ui/components/base/HorizontalAnimalCardSkeleton';
import RegionalNearbyAnimalCardSkeleton from '@/packages/ui/components/base/RegionalNearbyAnimalCardSkeleton';
import HomeAdoptionHero from '@/packages/ui/components/home/HomeAdoptionHero';

const PageTemplate = dynamic(
  () => import('@/packages/ui/components/base/PageTemplate'),
  { ssr: true }
);

const PageFooter = dynamic(
  () => import('@/packages/ui/components/base/PageFooter'),
  { ssr: true }
);



const HorizontalAnimalList = dynamic(
  () => import('@/packages/ui/components/shelter/HorizontalAnimalList'),
  { ssr: true }
);

const SidoMatchedHorizontalAnimalList = dynamic(
  () => import('@/packages/ui/components/shelter/SidoMatchedHorizontalAnimalList'),
  { ssr: true }
);

export default function Home() {
  return (
    <main className="page-container-full">
      <PageTemplate visibleHomeTab={false}>
        <HomeAdoptionHero />
        <div className="w-full mb-8 sm:mb-10">

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
        <div className="w-full mb-8 sm:mb-10">
          <Suspense
            fallback={
              <section className="w-full pt-4 sm:pt-5 pb-6 sm:pb-8 rounded-2xl bg-gray-100 px-4 sm:px-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 tracking-tight">
                  <svg
                    className="w-5 h-5 shrink-0 text-primary1"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.54 22.351l.07.04.028.016a.76.76 0 00.724 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                 {'\uB0B4 \uC9C0\uC5ED \uADFC\uCC98 \uC544\uC774\uB4E4'}
                </h2>
                <div className="flex gap-7 sm:gap-9 overflow-x-auto pt-2 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="snap-center">
                      <RegionalNearbyAnimalCardSkeleton />
                    </div>
                  ))}
                </div>
              </section>
            }
          >
            <SidoMatchedHorizontalAnimalList />
          </Suspense>
        </div>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
