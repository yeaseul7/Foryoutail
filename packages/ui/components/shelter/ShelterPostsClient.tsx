'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShelterAnimalItem } from '@/packages/type/postType';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import AbandonedCard from '../base/AbandonedCard';
import AbandonedCardSkeleton from '../base/AbandonedCardSkeleton';
import AnimalFilterHeader, { AnimalFilterState } from './AnimalFilterHeader';
import { fetchShelterAnimalData, FetchShelterAnimalDataResult } from '@/lib/api/shelter';
import { gatherListQuickMatches, type ListQuickFilterId } from '@/lib/shelter/listQuickFilter';
import SearchAi from './SearchAi';
import { sidoLocation } from '@/static/data/sidoLocation';

interface ShelterPostsClientProps {
  initialData: FetchShelterAnimalDataResult;
}

const LIST_QUICK_BUTTONS: {
  id: ListQuickFilterId;
  emoji: string;
  label: string;
}[] = [
    { id: 'birthYear', emoji: '👶', label: '올해 출생' },
    { id: 'noticeEnding', emoji: '⏰', label: '공고 종료 임박' },
    { id: 'recentReg', emoji: '🆕', label: '최근 등록' },
    { id: 'neutered', emoji: '🏥', label: '중성화 완료' },
  ];

const QUICK_FILTER_LABEL: Record<
  NonNullable<AnimalFilterState['quickFilter']>,
  string
> = {
  humanDog: '사람 좋아하는 강아지',
  humanCat: '사람 좋아하는 고양이',
  gentleCat: '순한 고양이',
  nearby: '근처 지역',
  gentleDog: '순한 강아지',
  young: '어린 동물',
};

const UP_KIND_LABEL: Record<string, string> = {
  '417000': '개',
  '422400': '고양이',
  '429900': '기타',
};

const UP_KIND_BADGES: { value: '417000' | '422400' | '429900'; label: string }[] = [
  { value: '417000', label: '강아지' },
  { value: '422400', label: '고양이' },
  { value: '429900', label: '기타' },
];

const SEX_LABEL: Record<string, string> = {
  F: '여자',
  M: '남자',
  Q: '미상',
};

const STATE_LABEL: Record<string, string> = {
  notice: '공고중',
  protect: '보호중',
};

const NEUTER_LABEL: Record<string, string> = {
  Y: '중성화 완료',
  N: '중성화 전',
  U: '중성화 미상',
};

function dashYmdFromCompact(ymd: string): string {
  if (ymd.length !== 8) return ymd;
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`;
}

function receiptRangeLabel(bgnde: string | null, endde: string | null): string | null {
  if (!bgnde && !endde) return null;
  const a = bgnde ? dashYmdFromCompact(bgnde) : '…';
  const b = endde ? dashYmdFromCompact(endde) : '…';
  return `접수일 ${a} ~ ${b}`;
}

function regionShortFromCode(upr_cd: string | null): string | null {
  if (!upr_cd) return null;
  const hit = sidoLocation.items.find((item) => item.SIDO_CD === upr_cd);
  if (!hit) return '선택 지역';
  return getShortSidoName(hit.SIDO_NAME);
}

function buildFilterSummaryTags(filters: AnimalFilterState): string[] {
  const tags: string[] = [];
  const q = filters.searchQuery.trim();
  if (q) {
    const short = q.length > 26 ? `${q.slice(0, 26)}…` : q;
    tags.push(`검색 · ${short}`);
  }
  if (filters.quickFilter) {
    tags.push(QUICK_FILTER_LABEL[filters.quickFilter]);
  }
  if (
    filters.upKindCd &&
    filters.upKindCd !== '417000' &&
    UP_KIND_LABEL[filters.upKindCd]
  ) {
    tags.push(`축종 · ${UP_KIND_LABEL[filters.upKindCd]}`);
  }
  if (filters.sexCd && SEX_LABEL[filters.sexCd]) {
    tags.push(`성별 · ${SEX_LABEL[filters.sexCd]}`);
  }
  if (filters.state && STATE_LABEL[filters.state]) {
    tags.push(`상태 · ${STATE_LABEL[filters.state]}`);
  }
  if (filters.neuterYn && NEUTER_LABEL[filters.neuterYn]) {
    tags.push(NEUTER_LABEL[filters.neuterYn]);
  }
  const region = regionShortFromCode(filters.upr_cd);
  if (region) {
    tags.push(`지역 · ${region}`);
  }
  const receipt = receiptRangeLabel(filters.bgnde, filters.endde);
  if (receipt) tags.push(receipt);
  return tags;
}

export default function ShelterPostsClient({ initialData }: ShelterPostsClientProps) {
  const searchParams = useSearchParams();
  const appliedUrlQueryRef = useRef(false);
  const [shelterAnimalData, setShelterAnimalData] = useState<ShelterAnimalItem[]>(
    initialData.items
  );
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /** 기본 축종: 강아지(개) */
  const [filters, setFilters] = useState<AnimalFilterState>({
    sexCd: null,
    state: null,
    upKindCd: '417000',
    neuterYn: null,
    quickFilter: null,
    searchQuery: '',
    bgnde: null,
    endde: null,
    upr_cd: null,
  });
  const filtersRef = useRef<AnimalFilterState>(filters);
  const isLoadingMoreRef = useRef(false);
  const isFilterRequestInProgress = useRef(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const pageNoRef = useRef(pageNo);
  const hasMoreRef = useRef(hasMore);
  pageNoRef.current = pageNo;
  hasMoreRef.current = hasMore;

  const [listQuickFilter, setListQuickFilter] = useState<ListQuickFilterId | null>(null);
  const listQuickFilterRef = useRef<ListQuickFilterId | null>(null);
  const listQuickNextApiPageRef = useRef(1);
  const shelterAnimalDataRef = useRef(shelterAnimalData);

  useEffect(() => {
    listQuickFilterRef.current = listQuickFilter;
  }, [listQuickFilter]);

  useEffect(() => {
    shelterAnimalDataRef.current = shelterAnimalData;
  }, [shelterAnimalData]);

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
      if (!isInitial) {
        if (isLoadingMoreRef.current || isFilterRequestInProgress.current) return;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      }

      try {
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
        if (!isInitial) {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
        if (isInitial) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLoadMoreListQuick = useCallback(async () => {
    const mode = listQuickFilterRef.current;
    if (!mode) return;
    if (!hasMoreRef.current || isLoadingMoreRef.current || isFilterRequestInProgress.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const seen = new Set(
        shelterAnimalDataRef.current
          .map((x) => x.desertionNo?.trim())
          .filter((x): x is string => Boolean(x)),
      );
      const snap: AnimalFilterState = { ...filtersRef.current, quickFilter: null };
      const yearFull = new Date().getFullYear();
      const { picked, nextPage, exhausted } = await gatherListQuickMatches(
        snap,
        mode,
        listQuickNextApiPageRef.current,
        seen,
        yearFull,
        7,
      );
      listQuickNextApiPageRef.current = nextPage;
      setShelterAnimalData((prev) => [...prev, ...picked]);
      setHasMore(!exhausted);
    } catch (e) {
      console.error('빠른 필터 추가 로드 실패:', e);
      setHasMore(false);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: AnimalFilterState) => {
    const prevFilters = filtersRef.current;
    const isSearchQueryChanged =
      prevFilters.searchQuery !== newFilters.searchQuery;
    const isOtherFilterChanged =
      prevFilters.sexCd !== newFilters.sexCd ||
      prevFilters.state !== newFilters.state ||
      prevFilters.upKindCd !== newFilters.upKindCd ||
      prevFilters.neuterYn !== newFilters.neuterYn ||
      prevFilters.quickFilter !== newFilters.quickFilter ||
      prevFilters.bgnde !== newFilters.bgnde ||
      prevFilters.endde !== newFilters.endde ||
      prevFilters.upr_cd !== newFilters.upr_cd;
    if (!isSearchQueryChanged && !isOtherFilterChanged) {
      return;
    }

    const snap: AnimalFilterState = {
      ...newFilters,
      quickFilter: listQuickFilterRef.current ? null : newFilters.quickFilter,
    };
    setFilters(snap);

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
        if (listQuickFilterRef.current) {
          listQuickNextApiPageRef.current = 1;
          const seen = new Set<string>();
          const yearFull = new Date().getFullYear();
          const { picked, nextPage, exhausted } = await gatherListQuickMatches(
            snap,
            listQuickFilterRef.current,
            1,
            seen,
            yearFull,
            7,
          );
          listQuickNextApiPageRef.current = nextPage;
          setShelterAnimalData(picked);
          setHasMore(!exhausted);
        } else {
          const result = await fetchShelterAnimalData(1, snap);
          const items = Array.isArray(result.items) ? result.items : [];
          setShelterAnimalData(items);
          setHasMore(result.hasMore ?? false);
        }
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

  const handleUpKindBadgePress = useCallback(
    (value: (typeof UP_KIND_BADGES)[number]['value']) => {
      const base = filtersRef.current;
      if ((base.upKindCd ?? '417000') === value) return;
      handleFilterChange({ ...base, upKindCd: value });
    },
    [handleFilterChange],
  );

  const handleListQuickChange = useCallback((next: ListQuickFilterId | null) => {
    listQuickFilterRef.current = next;
    setListQuickFilter(next);
    const base: AnimalFilterState = {
      ...filtersRef.current,
      quickFilter: null,
    };
    setFilters(base);

    if (next === null) {
      listQuickNextApiPageRef.current = 1;
      isFilterRequestInProgress.current = true;
      setPageNo(1);
      setShelterAnimalData([]);
      setHasMore(true);
      setLoading(true);
      void (async () => {
        try {
          const result = await fetchShelterAnimalData(1, base);
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
      })();
      return;
    }

    if (isFilterRequestInProgress.current) return;
    isFilterRequestInProgress.current = true;
    setPageNo(1);
    setShelterAnimalData([]);
    setHasMore(true);
    setLoading(true);
    void (async () => {
      try {
        listQuickNextApiPageRef.current = 1;
        const seen = new Set<string>();
        const yearFull = new Date().getFullYear();
        const { picked, nextPage, exhausted } = await gatherListQuickMatches(
          base,
          next,
          1,
          seen,
          yearFull,
          7,
        );
        listQuickNextApiPageRef.current = nextPage;
        setShelterAnimalData(picked);
        setHasMore(!exhausted);
      } catch (e) {
        console.error('빠른 필터 목록 조회 실패:', e);
        setShelterAnimalData([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        isFilterRequestInProgress.current = false;
      }
    })();
  }, []);

  useEffect(() => {
    if (appliedUrlQueryRef.current) return;
    const q = searchParams.get('q')?.trim();
    const sex = searchParams.get('sex');
    const upkind = searchParams.get('upkind');
    const neuter = searchParams.get('neuter');
    const state = searchParams.get('state');
    const quickFilter = searchParams.get('quickFilter');
    const uprCd = searchParams.get('upr_cd');
    const hasFilterParams = Boolean(
      q || sex || upkind || neuter || state || quickFilter || uprCd,
    );
    if (!hasFilterParams) return;
    appliedUrlQueryRef.current = true;
    handleFilterChange({
      ...filtersRef.current,
      searchQuery: q ?? '',
      sexCd: sex === 'M' || sex === 'F' || sex === 'Q' ? sex : null,
      upKindCd:
        upkind === '417000' || upkind === '422400' || upkind === '429900'
          ? upkind
          : '417000',
      neuterYn:
        neuter === 'Y' || neuter === 'N' || neuter === 'U' ? neuter : null,
      state: state === 'notice' || state === 'protect' ? state : null,
      quickFilter:
        quickFilter === 'humanDog' ||
          quickFilter === 'humanCat' ||
          quickFilter === 'gentleCat' ||
          quickFilter === 'nearby' ||
          quickFilter === 'gentleDog' ||
          quickFilter === 'young'
          ? quickFilter
          : null as AnimalFilterState['quickFilter'],
      upr_cd: uprCd && /^\d{7}$/.test(uprCd) ? uprCd : null,
    });
  }, [searchParams, handleFilterChange]);

  const handleLoadMorePage = useCallback(() => {
    if (!hasMoreRef.current || isLoadingMoreRef.current || isFilterRequestInProgress.current) return;
    if (listQuickFilterRef.current) {
      void handleLoadMoreListQuick();
      return;
    }
    const next = pageNoRef.current + 1;
    setPageNo(next);
    handleFetchShelterAnimalData(next, false, filtersRef.current);
  }, [handleFetchShelterAnimalData, handleLoadMoreListQuick]);

  /** 전체 페이지 스크롤: 하단 감지 시 다음 100건 배치 자동 로드 */
  useEffect(() => {
    const node = loadMoreSentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMorePage();
        }
      },
      { root: null, rootMargin: '280px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, shelterAnimalData.length, loading, handleLoadMorePage]);

  const postCount =
    loading && shelterAnimalData.length === 0
      ? null
      : shelterAnimalData.length > 0
        ? shelterAnimalData.length.toLocaleString()
        : '0';

  const filterSummaryTags = useMemo(() => buildFilterSummaryTags(filters), [filters]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl pb-4 sm:pb-5">
      <div className="flex flex-col pt-5 sm:pt-6">
        <div className="flex min-w-0 w-full flex-1 flex-col items-stretch gap-3">
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="축종 선택"
          >
            {UP_KIND_BADGES.map(({ value, label }) => {
              const active = (filters.upKindCd ?? '417000') === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleUpKindBadgePress(value)}
                  className={`inline-flex items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition-all sm:px-4 sm:py-2 sm:text-[15px] ${active
                    ? 'border-primary1 bg-primary1/10 text-primary1 ring-1 ring-primary1/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
                    : 'border-gray-200 bg-white text-gray-800 shadow-sm hover:border-primary1/35 hover:bg-primary1/[0.06]'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <AnimalFilterHeader
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          <SearchAi />

          {/* 입양 공고: 제목·설명·적용 필터 칩 아래에 빠른 선택 뱃지 */}
          <div className="flex w-full flex-col gap-2 px-0 pb-2 pt-5 sm:pb-4 sm:pt-7">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  입양 공고
                  {postCount !== null && (
                    <span className="text-primary1 ml-1.5">{postCount}</span>
                  )}
                </h2>
                <div className="mt-1.5 space-y-2">
                  <p className="text-sm leading-snug text-gray-600">
                    {filterSummaryTags.length > 0
                      ? '적용한 조건에 맞는 보호소 입양 공고만 골라 보여드려요.'
                      : '전국 보호소 입양 공고를 기본 조건으로 보여드리고 있어요.'}
                  </p>
                  {filterSummaryTags.length > 0 && (
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="list"
                      aria-label="적용된 필터"
                    >
                      {filterSummaryTags.map((tag, i) => (
                        <span
                          key={`${i}-${tag}`}
                          role="listitem"
                          className="inline-flex max-w-full items-center rounded-full border border-primary1/20 bg-primary1/10 px-2.5 py-0.5 text-[11px] font-medium text-primary1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:text-xs"
                        >
                          <span className="truncate">{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-3"
                  role="group"
                  aria-label="빠른 선택 필터"
                >
                  {LIST_QUICK_BUTTONS.map(({ id, emoji, label }) => {
                    const active = listQuickFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleListQuickChange(active ? null : id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all sm:px-4 sm:py-2 sm:text-[15px] ${
                          active
                            ? 'border-primary1 bg-primary1/10 text-primary1 ring-1 ring-primary1/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
                            : 'border-gray-200 bg-white text-gray-800 shadow-sm hover:border-primary1/35 hover:bg-primary1/[0.06]'
                        }`}
                      >
                        <span aria-hidden>{emoji}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 sm:pt-0.5">
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
          </div>

          {shelterAnimalData.length === 0 && !loading && !hasMore ? (
            <div className="py-16 text-center text-gray-500 sm:py-20">
              유기동물 데이터가 없습니다.
            </div>
          ) : (
            <>
              <div className="mx-auto w-full min-w-0 ">
                {loading && shelterAnimalData.length === 0 ? (
                  <div
                    className="grid grid-cols-1 justify-items-stretch gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4"
                    role="list"
                    aria-busy="true"
                    aria-label="입양 공고 목록 불러오는 중"
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div key={`skeleton-${index}`} role="listitem" className="min-w-0">
                        <AbandonedCardSkeleton />
                      </div>
                    ))}
                  </div>
                ) : shelterAnimalData.length > 0 ? (
                  <>
                    <div
                      className="grid grid-cols-1 justify-items-stretch gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4"
                      role="list"
                      aria-label="입양 공고 목록"
                    >
                      {shelterAnimalData.map((item) => (
                        <div key={item.desertionNo} role="listitem" className="min-w-0">
                          <AbandonedCard shelterAnimal={item} />
                        </div>
                      ))}
                    </div>
                    {hasMore ? (
                      <div
                        ref={loadMoreSentinelRef}
                        className="pointer-events-none h-14 w-full shrink-0"
                        aria-hidden
                      />
                    ) : null}
                  </>
                ) : !loading && hasMore ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-gray-600 sm:py-14">
                    <p className="max-w-md leading-relaxed">
                      방금 불러온 구간에는 조건에 맞는 공고가 없어요. 스크롤하면 다음 구간(100건)을
                      불러와 이어서 찾아볼게요.
                    </p>
                    <div
                      ref={loadMoreSentinelRef}
                      className="pointer-events-none h-14 w-full shrink-0"
                      aria-hidden
                    />
                  </div>
                ) : null}
              </div>
              {isLoadingMore && (
                <div className="flex justify-center py-4 text-sm text-gray-500 sm:py-5">
                  더 불러오는 중...
                </div>
              )}
              {!hasMore && shelterAnimalData.length > 0 && (
                <div className="py-6 text-center text-gray-500 sm:py-8">
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

