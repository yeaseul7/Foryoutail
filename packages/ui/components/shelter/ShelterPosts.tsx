'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ShelterAnimalItem } from '@/packages/type/postType';
import AbandonedCard from '../../base/AbandonedCard';
import AbandonedCardSkeleton from '../../base/AbandonedCardSkeleton';
import AnimalFilterHeader, { AnimalFilterState } from './AnimalFilterHeader';
import { fetchShelterAnimalData } from '@/lib/api/shelter';

export default function ShelterPosts() {
  const [shelterAnimalData, setShelterAnimalData] = useState<
    ShelterAnimalItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState<AnimalFilterState>({
    sexCd: null,
    state: null,
    upKindCd: null,
    searchQuery: '',
    bgnde: null,
    endde: null,
    upr_cd: null,
  });
  const filtersRef = useRef<AnimalFilterState>(filters);
  const isLoadingMoreRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFilterRequestInProgress = useRef(false);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  const handleFetchShelterAnimalData = useCallback(
    async (
      page: number,
      isInitial = false,
      currentFilters?: AnimalFilterState,
    ) => {
      if (
        (isLoadingMoreRef.current || isFilterRequestInProgress.current) &&
        !isInitial
      )
        return;

      try {
        if (!isInitial) {
          setIsLoadingMore(true);
        }

        const filterParams = currentFilters || filtersRef.current;
        const result = await fetchShelterAnimalData(page, filterParams);

        if (isInitial) {
          setShelterAnimalData(result.items);
          setHasMore(result.hasMore);
        } else {
          setShelterAnimalData((prev) => {
            const newData = [...prev, ...result.items];
            setHasMore(result.hasMore);
            return newData;
          });
        }
      } catch (e) {
        console.error('유기견 보호소 데이터 조회 중 오류 발생:', e);
        setHasMore(false);
      } finally {
        setIsLoadingMore(false);
        if (isInitial) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFilterChange = useCallback((newFilters: AnimalFilterState) => {
    const prevFilters = filtersRef.current;
    const isSearchQueryChanged =
      prevFilters.searchQuery !== newFilters.searchQuery;
    const isOtherFilterChanged =
      prevFilters.sexCd !== newFilters.sexCd ||
      prevFilters.state !== newFilters.state ||
      prevFilters.upKindCd !== newFilters.upKindCd ||
      prevFilters.bgnde !== newFilters.bgnde ||
      prevFilters.endde !== newFilters.endde;

    if (!isSearchQueryChanged && !isOtherFilterChanged) {
      return;
    }

    setFilters(newFilters);

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    const applyFilters = async () => {
      if (isFilterRequestInProgress.current) return;

      isFilterRequestInProgress.current = true;
      setPageNo(1);
      setShelterAnimalData([]);
      setHasMore(true);
      setLoading(true);

      try {
        const result = await fetchShelterAnimalData(1, newFilters);
        setShelterAnimalData(result.items);
        setHasMore(result.hasMore);
      } catch (e) {
        console.error('유기견 보호소 데이터 조회 중 오류 발생:', e);
        setHasMore(false);
      } finally {
        setLoading(false);
        isFilterRequestInProgress.current = false;
      }
    };

    // 검색어 변경 시 디바운싱 적용, 다른 필터는 즉시 적용
    if (isSearchQueryChanged) {
      filterTimeoutRef.current = setTimeout(applyFilters, 500);
    } else {
      applyFilters();
    }
  }, []);

  useEffect(() => {
    handleFetchShelterAnimalData(1, true);
  }, [handleFetchShelterAnimalData]);

  useEffect(() => {
    if (loading || !hasMore) {
      return;
    }

    if (isLoadingMore) {
      return;
    }

    if (isFilterRequestInProgress.current) {
      return;
    }

    const currentTarget = observerTarget.current;
    if (!currentTarget) {
      const timeoutId = setTimeout(() => {
        const retryTarget = observerTarget.current;
        if (
          retryTarget &&
          hasMore &&
          !isLoadingMore &&
          !isFilterRequestInProgress.current
        ) {
          const observer = new IntersectionObserver(
            (entries) => {
              if (entries[0].isIntersecting) {
                if (
                  hasMore &&
                  !isLoadingMoreRef.current &&
                  !isFilterRequestInProgress.current
                ) {
                  const nextPage = pageNo + 1;
                  setPageNo(nextPage);
                  handleFetchShelterAnimalData(nextPage, false, filtersRef.current);
                }
              }
            },
            {
              threshold: 0.1,
              rootMargin: '200px',
            },
          );
          observer.observe(retryTarget);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (
            hasMore &&
            !isLoadingMoreRef.current &&
            !isFilterRequestInProgress.current
          ) {
            const nextPage = pageNo + 1;
            setPageNo(nextPage);
            handleFetchShelterAnimalData(nextPage, false, filtersRef.current);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      },
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect();
    };
  }, [loading, hasMore, isLoadingMore, pageNo, handleFetchShelterAnimalData]);


  return (
    <>
      <AnimalFilterHeader
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      {shelterAnimalData.length === 0 && !loading ? (
        <div className="py-12 text-center text-gray-500">
          유기동물 데이터가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 pt-8 w-full px-4 sm:px-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
          {loading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <AbandonedCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : (
            <>
              {shelterAnimalData.map((shelterAnimal: ShelterAnimalItem) => (
                <AbandonedCard
                  key={shelterAnimal.desertionNo}
                  shelterAnimal={shelterAnimal}
                />
              ))}
              {isLoadingMore && (
                Array.from({ length: 12 }).map((_, index) => (
                  <AbandonedCardSkeleton key={`skeleton-more-${index}`} />
                ))
              )}
            </>
          )}
        </div>
      )}
      {hasMore && !loading && (
        <div
          ref={observerTarget}
          className="h-32 flex justify-center items-center py-12"
          data-testid="infinite-scroll-trigger"
        />
      )}
      {!hasMore && shelterAnimalData.length > 0 && (
        <div className="text-center text-gray-500 py-8">
          모든 데이터를 불러왔습니다.
        </div>
      )}
    </>
  );
}
