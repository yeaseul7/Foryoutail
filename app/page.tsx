'use client';
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import HomeTabSkeleton from '@/packages/ui/components/base/HomeTabSkeleton';
import PostCardSkeleton from '@/packages/ui/components/base/PostCardSkeleton';

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
          <Banner />

          <Suspense fallback={
            <div className="w-full">
              <div className="grid grid-cols-1 gap-4 px-4 pt-8 w-full sm:px-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <PostCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            </div>
          }>
            <HorizontalAnimalList />
          </Suspense>
        </div>
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
