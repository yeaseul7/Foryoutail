'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ShelterAnimalItem } from '@/packages/type/postType';
import AbandonedCardSkeleton from '../base/AbandonedCardSkeleton';
import AnimalFilterHeader, { AnimalFilterState } from './AnimalFilterHeader';
import { fetchShelterAnimalData, FetchShelterAnimalDataResult } from '@/lib/api/shelter';
import SearchAi from './SearchAi';
import RegionMap from './RegionMap';
import VirtualizedShelterGrid from './VirtualizedShelterGrid';

interface ShelterPostsClientProps {
  initialData: FetchShelterAnimalDataResult;
}

export default function ShelterPostsClient({ initialData }: ShelterPostsClientProps) {
  const [shelterAnimalData, setShelterAnimalData] = useState<ShelterAnimalItem[]>(
    initialData.items
  );
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /** 지역 기본값: 서울 (서버 초기 조회와 동일) */
  const [filters, setFilters] = useState<AnimalFilterState>({
    sexCd: null,
    state: null,
    upKindCd: null,
    searchQuery: '',
    bgnde: null,
    endde: null,
    upr_cd: '6110000', // 서울특별시
  });
  const filtersRef = useRef<AnimalFilterState>(filters);
  const isLoadingMoreRef = useRef(false);
  const isFilterRequestInProgress = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const pageNoRef = useRef(pageNo);
  const hasMoreRef = useRef(hasMore);
  pageNoRef.current = pageNo;
  hasMoreRef.current = hasMore;

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]?.contentRect ?? {};
      if (w != null && h != null) setGridSize({ width: w, height: h });
    });
    ro.observe(el);
    const { width: w, height: h } = el.getBoundingClientRect();
    if (w && h) setGridSize({ width: w, height: h });
    return () => ro.disconnect();
  }, []);

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
      prevFilters.endde !== newFilters.endde ||
      prevFilters.upr_cd !== newFilters.upr_cd;
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
        const items = Array.isArray(result.items) ? result.items : [];
        setShelterAnimalData(items);
        setHasMore(result.hasMore ?? false);
      } catch (e) {
        console.error('유기견 보호소 데이터 조회 중 오류 발생:', e);
        setShelterAnimalData([]);
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

  const handleScrollNearEnd = useCallback(() => {
    if (!hasMoreRef.current || isLoadingMoreRef.current || isFilterRequestInProgress.current) return;
    const next = pageNoRef.current + 1;
    setPageNo(next);
    handleFetchShelterAnimalData(next, false, filtersRef.current);
  }, [handleFetchShelterAnimalData]);

  const postCount =
    loading && shelterAnimalData.length === 0
      ? null
      : shelterAnimalData.length > 0
        ? shelterAnimalData.length.toLocaleString()
        : '0';

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 pb-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 pt-4">
        <aside className="hidden lg:block lg:w-[280px] xl:w-[320px] shrink-0 pt-6 sm:pt-10">
          <div className="lg:sticky lg:top-4 flex flex-col gap-4">
            <RegionMap
              height="280px"
              selectedSidoCd={filters.upr_cd}
              onSidoSelect={(sidoCd) =>
                handleFilterChange({ ...filters, upr_cd: sidoCd })
              }
              initialSidoCd="6110000"
            />

          </div>
        </aside>

        {/* 오른쪽 메인: 필터 + AI 검색 + 입양 공고 목록 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <AnimalFilterHeader
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          <SearchAi />

          {/* 입양 공고 섹션 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-6 pb-3 px-0 sm:px-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                입양 공고
                {postCount !== null && (
                  <span className="text-primary1 ml-1.5">{postCount}</span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                현재 전국 보호소 친구들을 보여드리고 있어요.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary1/20 focus:border-primary1"
                defaultValue="recent"
                aria-label="정렬"
              >
                <option value="recent">최근 공고순</option>
              </select>
              <button
                type="button"
                className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="그리드 보기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {shelterAnimalData.length === 0 && !loading ? (
            <div className="py-12 text-center text-gray-500">
              유기동물 데이터가 없습니다.
            </div>
          ) : (
            <>
              {/* 컨테이너를 항상 마운트해 ref/ResizeObserver가 유지되도록 함 (필터 적용 후 그리드가 다시 보이도록) */}
              <div
                ref={gridContainerRef}
                className="w-full h-[65vh] min-h-[400px] overflow-hidden"
              >
                {loading && shelterAnimalData.length === 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 justify-items-center h-full content-start">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <AbandonedCardSkeleton key={`skeleton-${index}`} />
                    ))}
                  </div>
                ) : gridSize.width > 0 && gridSize.height > 0 && shelterAnimalData.length > 0 ? (
                  <VirtualizedShelterGrid
                    key={`grid-${filters.upr_cd ?? ''}-${filters.upKindCd ?? ''}-${filters.sexCd ?? ''}-${filters.state ?? ''}`}
                    items={shelterAnimalData}
                    width={gridSize.width}
                    height={gridSize.height}
                    onScrollNearEnd={handleScrollNearEnd}
                  />
                ) : null}
              </div>
              {isLoadingMore && (
                <div className="flex justify-center py-4 text-sm text-gray-500">
                  더 불러오는 중...
                </div>
              )}
              {!hasMore && shelterAnimalData.length > 0 && (
                <div className="text-center text-gray-500 py-8">
                  모든 데이터를 불러왔습니다.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
