import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import ShelterPostsClient from '@/packages/components/shelter/ShelterPostsClient';
import AbandonedCardSkeleton from '@/packages/components/skeleton/AbandonedCardSkeleton';
import { generateDefaultMetadata, getBaseUrl } from '@/packages/utils/metadata';
import { applyShelterClientFilters, SHELTER_API_PAGE_SIZE } from '@/lib/client/shelter';
import { getCachedShelterAnimals } from '@/lib/server/cached-shelter';
import { matchListQuickFilter } from '@/lib/shelter/listQuickFilter';
import { parseShelterUrlFilters, type ShelterSearchParams } from '@/lib/shelter/urlFilters';

export const revalidate = 600;

export const metadata: Metadata = generateDefaultMetadata(
  '전국 유기동물 입양 공고',
  '전국 유기견·유기묘 입양 공고를 지역과 상태별로 확인하고, 가족을 기다리는 아이들을 꼬순내에서 찾아보세요.',
  getBaseUrl().replace(/\/$/, ''),
  {
    defaultImagePath: '/static/images/shelter-og.png',
    imageWidth: 1536,
    imageHeight: 1024,
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

export default async function Shelter({
  searchParams,
}: {
  searchParams: Promise<ShelterSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const { filters, listQuickFilter } = parseShelterUrlFilters(resolvedSearchParams);
  const result = await getCachedShelterAnimals({
    pageNo: '1',
    numOfRows: String(SHELTER_API_PAGE_SIZE),
    sex_cd: filters.sexCd ?? undefined,
    state: filters.state ?? undefined,
    upkind: filters.upKindCd ?? undefined,
    neuter_yn: filters.neuterYn ?? undefined,
    bgnde: filters.bgnde ?? undefined,
    endde: filters.endde ?? undefined,
    upr_cd: filters.upr_cd ?? undefined,
    orgNm: filters.orgNm ?? undefined,
    searchQuery: filters.searchQuery || undefined,
    sort: filters.sortOrder,
  });
  let items = applyShelterClientFilters(result.items, filters);
  if (listQuickFilter) {
    items = items.filter((item) =>
      matchListQuickFilter(item, listQuickFilter, {
        yearFull: new Date().getFullYear(),
        recentWindowDays: 7,
      }),
    );
  }

  return (
    <main className="page-container-full">
      <PageTemplate>
        <Suspense fallback={<ShelterPostsFallback />}>
          <ShelterPostsClient
            initialData={{ items, hasMore: result.hasMore }}
            initialFilters={filters}
            initialListQuickFilter={listQuickFilter}
          />
        </Suspense>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
