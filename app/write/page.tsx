'use client';
import PageTemplate from '@/packages/ui/components/base/PageTemplate';
import dynamic from 'next/dynamic';
import WriteContainerSkeleton from '@/packages/ui/components/base/WriteContainerSkeleton';
import PageFooter from '@/packages/ui/components/base/PageFooter';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PostBoardCategory } from '@/packages/type/postType';

const WriteContainer = dynamic(
  () => import('@/packages/ui/components/home/write/WriteContainer'),
  {
    ssr: false,
    loading: () => <WriteContainerSkeleton />
  }
);

function parseWriteCategoryParam(value: string | null): PostBoardCategory | undefined {
  if (value === 'daily' || value === 'question' || value === 'adoption') return value;
  return undefined;
}

function WritePageContent() {
  const searchParams = useSearchParams();
  const initialCategory = parseWriteCategoryParam(searchParams.get('category'));

  return (
    <WriteContainer
      className="flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 w-full"
      initialCategory={initialCategory}
    />
  );
}

export default function WritePage() {
  return (
    <main className="page-container-full">
      <PageTemplate visibleHeaderButtons={false}>
        <div className="flex h-full min-h-0 flex-col w-full">
          <Suspense fallback={<WriteContainerSkeleton />}>
            <WritePageContent />
          </Suspense>
        </div>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
