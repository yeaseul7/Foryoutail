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



const HorizontalAnimalList = dynamic(
  () => import('@/packages/ui/components/shelter/HorizontalAnimalList'),
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
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
