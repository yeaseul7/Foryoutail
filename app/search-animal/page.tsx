'use client';

import dynamic from 'next/dynamic';
import { useSearchAnimal } from '@/hooks/useSearchAnimal';
import AiHeader from '@/packages/components/search-animals/AiHeader';
import LikeAnimals from '@/packages/components/search-animals/LikeAnimals';

const PageTemplate = dynamic(
    () => import('@/packages/components/base/PageTemplate'),
    { ssr: true }
);

const PageFooter = dynamic(
    () => import('@/packages/components/base/PageFooter'),
    { ssr: true }
);

export default function SearchAnimalPage() {
    const {
        previewUrl,
        modelReady,
        searchLoading,
        searchMatches,
        searchError,
        dailyAiUsed,
        dailyLimit,
        filters,
        setFilters,
        loadModel,
        onFileChange,
        runSearch,
    } = useSearchAnimal();

    return (
        <main className="page-container-full">
            <PageTemplate>
                <div className="w-full">
                    <AiHeader
                        previewUrl={previewUrl}
                        searchLoading={searchLoading}
                        modelReady={modelReady}
                        dailyAiUsed={dailyAiUsed}
                        dailyLimit={dailyLimit}
                        filters={filters}
                        onFiltersChange={setFilters}
                        onFileChange={onFileChange}
                        onSearch={runSearch}
                        onLoadModel={loadModel}
                    />
                    <LikeAnimals
                        key={searchMatches ? `search-${searchMatches.length}-${searchMatches[0]?.id ?? ''}` : 'no-results'}
                        searchError={searchError}
                        searchMatches={searchMatches}
                    />
                </div>
            </PageTemplate>
            <PageFooter />
        </main>
    );
}
