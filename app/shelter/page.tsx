import { Suspense } from 'react';
import PageTemplate from '@/packages/ui/components/base/PageTemplate';
import PageFooter from '@/packages/ui/components/base/PageFooter';
import ShelterPostsServer from '@/packages/ui/components/shelter/ShelterPostsServer';
import AbandonedCardSkeleton from '@/packages/ui/components/base/AbandonedCardSkeleton';
import PreloadSearchModel from './PreloadSearchModel';

/** 공공 API no-store fetch + useSearchParams로 정적 프리렌더 불가 */
export const dynamic = 'force-dynamic';

function ShelterPostsFallback() {
  return (
    <div
      className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 justify-items-stretch gap-x-3 gap-y-8 px-0 py-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4"
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
        <PreloadSearchModel />
        <Suspense fallback={<ShelterPostsFallback />}>
          <ShelterPostsServer />
        </Suspense>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
