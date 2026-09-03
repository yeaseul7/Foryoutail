'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShelterAnimalItem } from '@/packages/type/postType';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import AbandonedCard from '../base/AbandonedCard';
import AbandonedCardSkeleton from '../skeleton/AbandonedCardSkeleton';
import AnimalFilterHeader, { AnimalFilterState } from './AnimalFilterHeader';
import { fetchShelterAnimalData, FetchShelterAnimalDataResult } from '@/lib/client/shelter';
import { gatherListQuickMatches, type ListQuickFilterId } from '@/lib/shelter/listQuickFilter';
import { QUICK_FILTER_ICONS, QUICK_FILTER_LABEL } from '@/lib/shelter/quickFilterLabels';
import { sidoLocation } from '@/static/data/sidoLocation';
import { useSearchAnimal } from '@/hooks/useSearchAnimal';
import type { SimilarMatch } from '@/lib/search-animal/types';
import { useLanguage } from '@/lib/i18n/language';
import { trackEvent } from '@/lib/analytics';
import { searchShelterAnimalsByText, TextSearchError } from '@/lib/client/textSearch';
import {
  MdArrowDropDown,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdRefresh,
  MdTune,
} from 'react-icons/md';

interface ShelterPostsClientProps {
  initialData: FetchShelterAnimalDataResult;
  initialFilters: AnimalFilterState;
  initialListQuickFilter: ListQuickFilterId | null;
}

interface ShelterListCache {
  version: 7;
  savedAt: number;
  query: string;
  items: ShelterAnimalItem[];
  filters: AnimalFilterState;
  listQuickFilter: ListQuickFilterId | null;
  pageNo: number;
  hasMore: boolean;
  totalCount: number;
  pageSize: number;
  scrollY: number;
  imageSearchActive: boolean;
}

const SHELTER_LIST_CACHE_KEY = 'kkosunnae_shelter_list_cache';
const SHELTER_LIST_CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeQueryString(value: string): string {
  const params = new URLSearchParams(value);
  params.sort();
  return params.toString();
}

function readShelterListCache(query: string): ShelterListCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SHELTER_LIST_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as ShelterListCache;
    const valid =
      cache?.version === 7 &&
      Date.now() - cache.savedAt <= SHELTER_LIST_CACHE_TTL_MS &&
      normalizeQueryString(cache.query) === normalizeQueryString(query) &&
      Array.isArray(cache.items) &&
      typeof cache.imageSearchActive === 'boolean' &&
      typeof cache.totalCount === 'number' &&
      cache.pageSize === (window.matchMedia('(max-width: 639px)').matches ? 10 : 50) &&
      cache.filters &&
      typeof cache.filters === 'object';
    if (!valid) {
      sessionStorage.removeItem(SHELTER_LIST_CACHE_KEY);
      return null;
    }
    return cache;
  } catch {
    sessionStorage.removeItem(SHELTER_LIST_CACHE_KEY);
    return null;
  }
}

function writeShelterListCache(cache: ShelterListCache): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SHELTER_LIST_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 저장 용량을 초과하면 UX를 방해하지 않고 캐시만 포기한다.
  }
}

function dedupeShelterAnimals(
  items: ShelterAnimalItem[],
): ShelterAnimalItem[] {
  const map = new Map<string, ShelterAnimalItem>();

  items.forEach((item) => {
    const desertionNo = item.desertionNo?.trim();
    const noticeNo = item.noticeNo?.trim();
    const key = `${desertionNo || ''}::${noticeNo || ''}`;

    if (!desertionNo && !noticeNo) {
      return;
    }

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return [...map.values()];
}

function similarMatchToShelterAnimal(match: SimilarMatch): ShelterAnimalItem | null {
  const metadata = (match.metadata ?? {}) as Partial<ShelterAnimalItem> & { imageUrl?: unknown };
  const desertionNo = typeof metadata.desertionNo === 'string' && metadata.desertionNo.trim()
    ? metadata.desertionNo.trim()
    : match.id?.trim();
  if (!desertionNo) return null;
  const imageUrl = typeof metadata.imageUrl === 'string' ? metadata.imageUrl : undefined;
  return {
    ...metadata,
    desertionNo,
    aiSimilarityScore: typeof match.score === 'number' ? match.score : undefined,
    popfile: metadata.popfile || imageUrl,
    popfile1: metadata.popfile1 || metadata.popfile || imageUrl,
  };
}

const LIST_QUICK_BUTTONS: {
  id: ListQuickFilterId;
  label: string;
}[] = [
  { id: 'noticeEnding', label: '마감 임박' },
  { id: 'birthYear', label: '어린 동물' },
];

type FilterSummaryRow =
  | {
    key: string;
    variant: 'quick';
    quick: NonNullable<AnimalFilterState['quickFilter']>;
    removeKey: FilterSummaryRemoveKey;
  }
  | { key: string; variant: 'text'; text: string; removeKey: FilterSummaryRemoveKey };

type FilterSummaryRemoveKey =
  | 'searchQuery'
  | 'quickFilter'
  | 'upKindCd'
  | 'sexCd'
  | 'state'
  | 'neuterYn'
  | 'region'
  | 'receiptDate';

function parseQuickFilterFromSearchParams(
  raw: string | null,
): AnimalFilterState['quickFilter'] {
  if (!raw) return null;
  if (raw === 'likesHuman' || raw === 'humanDog' || raw === 'humanCat') return 'likesHuman';
  if (raw === 'gentle' || raw === 'gentleDog' || raw === 'gentleCat') return 'gentle';
  if (raw === 'nearby' || raw === 'young') return raw;
  return null;
}

function parseListQuickFilter(raw: string | null): ListQuickFilterId | null {
  if (raw === 'recentReg' || raw === 'noticeEnding' || raw === 'birthYear' || raw === 'neutered') {
    return raw;
  }
  return null;
}

function createFilterSearchParams(
  filters: AnimalFilterState,
  listQuickFilter: ListQuickFilterId | null = null,
): URLSearchParams {
  const params = new URLSearchParams();
  const q = filters.searchQuery.trim();

  if (q) params.set('q', q);
  if (filters.sexCd) params.set('sex', filters.sexCd);
  if (filters.upKindCd) params.set('upkind', filters.upKindCd);
  if (filters.neuterYn) params.set('neuter', filters.neuterYn);
  if (filters.state) params.set('state', filters.state);
  if (filters.quickFilter) params.set('quickFilter', filters.quickFilter);
  if (filters.bgnde) params.set('bgnde', filters.bgnde);
  if (filters.endde) params.set('endde', filters.endde);
  if (filters.upr_cd) params.set('upr_cd', filters.upr_cd);
  if (filters.orgNm?.trim()) params.set('orgNm', filters.orgNm.trim());
  if (filters.sortOrder === 'rescue') params.set('sort', 'rescue');
  if (listQuickFilter) params.set('listQuick', listQuickFilter);

  return params;
}

function paginationItems(currentPage: number, totalPages: number): Array<number | `ellipsis-${number}`> {
  if (totalPages <= 4) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = [...new Set([currentPage, currentPage + 1, totalPages - 1, totalPages]
    .filter((page) => page >= 1 && page <= totalPages))].sort((a, b) => a - b);
  const items: Array<number | `ellipsis-${number}`> = [];
  if (pages[0] > 1) items.push(`ellipsis-${pages[0]}`);
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push(`ellipsis-${page}`);
    items.push(page);
  });
  return items;
}

const UP_KIND_LABEL: Record<string, string> = {
  '417000': '개',
  '422400': '고양이',
  '429900': '기타',
};

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

const ENGLISH_FILTER_LABEL: Record<string, string> = {
  개: 'Dogs', 고양이: 'Cats', 기타: 'Other', 여자: 'Female', 남자: 'Male', 미상: 'Unknown',
  공고중: 'Notice open', 보호중: 'In protection', '중성화 완료': 'Neutered', '중성화 전': 'Not neutered', '중성화 미상': 'Neuter status unknown',
  '마감 임박': 'Ending soon', '어린 동물': 'Young animals',
};

function dashYmdFromCompact(ymd: string): string {
  if (ymd.length !== 8) return ymd;
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`;
}

function receiptRangeLabel(bgnde: string | null, endde: string | null): string | null {
  if (!bgnde && !endde) return null;
  const a = bgnde ? dashYmdFromCompact(bgnde) : '…';
  const b = endde ? dashYmdFromCompact(endde) : '…';
  return `${a} ~ ${b}`;
}

function regionShortFromCode(upr_cd: string | null): string | null {
  if (!upr_cd) return null;
  const hit = sidoLocation.items.find((item) => item.SIDO_CD === upr_cd);
  if (!hit) return '선택 지역';
  return getShortSidoName(hit.SIDO_NAME);
}

function regionShortFromOrgNm(orgNm: string | null | undefined): string | null {
  if (!orgNm?.trim()) return null;
  return getShortSidoName(orgNm.trim());
}

function buildFilterSummaryRows(filters: AnimalFilterState): FilterSummaryRow[] {
  const rows: FilterSummaryRow[] = [];
  let n = 0;
  const pushText = (text: string, removeKey: FilterSummaryRemoveKey) => {
    rows.push({ key: `t-${n++}`, variant: 'text', text, removeKey });
  };

  const q = filters.searchQuery.trim();
  if (q) {
    const short = q.length > 26 ? `${q.slice(0, 26)}…` : q;
    pushText(short, 'searchQuery');
  }
  if (filters.quickFilter) {
    rows.push({
      key: `q-${filters.quickFilter}`,
      variant: 'quick',
      quick: filters.quickFilter,
      removeKey: 'quickFilter',
    });
  }
  if (
    filters.upKindCd &&
    filters.upKindCd !== '417000' &&
    UP_KIND_LABEL[filters.upKindCd]
  ) {
    pushText(UP_KIND_LABEL[filters.upKindCd], 'upKindCd');
  }
  if (filters.sexCd && SEX_LABEL[filters.sexCd]) {
    pushText(SEX_LABEL[filters.sexCd], 'sexCd');
  }
  if (filters.state && STATE_LABEL[filters.state]) {
    pushText(STATE_LABEL[filters.state], 'state');
  }
  if (filters.neuterYn && NEUTER_LABEL[filters.neuterYn]) {
    pushText(NEUTER_LABEL[filters.neuterYn], 'neuterYn');
  }
  const region = regionShortFromCode(filters.upr_cd) ?? regionShortFromOrgNm(filters.orgNm);
  if (region) {
    pushText(region, 'region');
  }
  const receipt = receiptRangeLabel(filters.bgnde, filters.endde);
  if (receipt) pushText(receipt, 'receiptDate');
  return rows;
}

export default function ShelterPostsClient({
  initialData,
  initialFilters,
  initialListQuickFilter,
}: ShelterPostsClientProps) {
  const { searchWithFile, searchError: imageSearchError } = useSearchAnimal();
  const { isEnglish } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cacheReadRef = useRef(false);
  const skipNextUrlSyncRef = useRef(false);
  const appliedUrlQueryRef = useRef(false);
  const [shelterAnimalData, setShelterAnimalData] = useState<ShelterAnimalItem[]>(
    initialData.items
  );
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [pageSize, setPageSize] = useState(50);
  const pageSizeRef = useRef(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  /** 기본 축종: 강아지(개) */
  const [filters, setFilters] = useState<AnimalFilterState>(initialFilters);
  const filtersRef = useRef<AnimalFilterState>(filters);
  const isLoadingMoreRef = useRef(false);
  const isFilterRequestInProgress = useRef(false);
  const pageNoRef = useRef(pageNo);
  const hasMoreRef = useRef(hasMore);
  pageNoRef.current = pageNo;
  hasMoreRef.current = hasMore;

  const [listQuickFilter, setListQuickFilter] = useState<ListQuickFilterId | null>(initialListQuickFilter);
  const listQuickFilterRef = useRef<ListQuickFilterId | null>(initialListQuickFilter);
  const listQuickNextApiPageRef = useRef(1);
  const shelterAnimalDataRef = useRef(shelterAnimalData);
  const loadedInitialRef = useRef(true);
  const scrollYRef = useRef(0);
  const [restoredScrollY, setRestoredScrollY] = useState<number | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [imageSearchActive, setImageSearchActive] = useState(false);
  const imageSearchActiveRef = useRef(false);
  const [textSearchLoading, setTextSearchLoading] = useState(false);
  const [textSearchError, setTextSearchError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('view_animal_list', {
      result_count: initialData.items.length,
      animal_type: initialFilters.upKindCd ?? undefined,
    });
  }, [initialData.items.length, initialFilters.upKindCd]);

  useEffect(() => {
    if (cacheReadRef.current) return;
    cacheReadRef.current = true;
    const cache = readShelterListCache(searchParams.toString());
    if (!cache) return;

    // 같은 마운트 사이클에서 아래 URL 동기화 effect가 빈/이전 쿼리로
    // 방금 복원한 필터를 초기화하지 않도록 최초 실행을 한 번 건너뛴다.
    skipNextUrlSyncRef.current = true;
    loadedInitialRef.current = true;
    shelterAnimalDataRef.current = cache.items;
    filtersRef.current = cache.filters;
    listQuickFilterRef.current = cache.listQuickFilter;
    pageNoRef.current = cache.pageNo;
    hasMoreRef.current = cache.hasMore;
    imageSearchActiveRef.current = cache.imageSearchActive;
    setImageSearchActive(cache.imageSearchActive);
    scrollYRef.current = cache.scrollY;
    setShelterAnimalData(cache.items);
    setFilters(cache.filters);
    setListQuickFilter(cache.listQuickFilter);
    setPageNo(cache.pageNo);
    setHasMore(cache.hasMore);
    setTotalCount(cache.totalCount);
    pageSizeRef.current = cache.pageSize;
    setPageSize(cache.pageSize);
    setRestoredScrollY(cache.scrollY);
  }, [searchParams]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const applyPageSize = () => {
      const nextPageSize = media.matches ? 10 : 50;
      if (pageSizeRef.current === nextPageSize) return;
      pageSizeRef.current = nextPageSize;
      setPageSize(nextPageSize);
      sessionStorage.removeItem(SHELTER_LIST_CACHE_KEY);
      if (imageSearchActiveRef.current) return;

      isFilterRequestInProgress.current = true;
      setPageNo(1);
      setShelterAnimalData([]);
      setLoading(true);
      void (async () => {
        try {
          const result = await fetchShelterAnimalData(1, filtersRef.current, undefined, nextPageSize);
          setShelterAnimalData(dedupeShelterAnimals(result.items));
          setHasMore(result.hasMore);
          setTotalCount(result.totalCount);
        } catch (error) {
          console.error('반응형 페이지 크기 적용 실패:', error);
          setHasMore(false);
        } finally {
          setLoading(false);
          isFilterRequestInProgress.current = false;
        }
      })();
    };

    applyPageSize();
    media.addEventListener('change', applyPageSize);
    return () => media.removeEventListener('change', applyPageSize);
  }, []);

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

  const persistListCache = useCallback(() => {
    writeShelterListCache({
      version: 7,
      savedAt: Date.now(),
      query: searchParams.toString(),
      items: shelterAnimalDataRef.current,
      filters: filtersRef.current,
      listQuickFilter: listQuickFilterRef.current,
      pageNo: pageNoRef.current,
      hasMore: hasMoreRef.current,
      totalCount,
      pageSize: pageSizeRef.current,
      scrollY: scrollYRef.current,
      imageSearchActive: imageSearchActiveRef.current,
    });
  }, [searchParams, totalCount]);

  useEffect(() => {
    const onScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      scrollYRef.current = window.scrollY;
      persistListCache();
    };
  }, [persistListCache]);

  useEffect(() => {
    if (!restoredScrollY || restoredScrollY <= 0) return;
    const firstFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: restoredScrollY, behavior: 'auto' }));
    });
    return () => cancelAnimationFrame(firstFrame);
  }, [restoredScrollY]);

  useEffect(() => {
    if (loading || isLoadingMore || isFilterRequestInProgress.current) return;
    persistListCache();
  }, [filters, hasMore, isLoadingMore, listQuickFilter, loading, pageNo, persistListCache, shelterAnimalData]);

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
        const result = await fetchShelterAnimalData(page, filterParams, undefined, pageSizeRef.current);
        if (isInitial) {
          setShelterAnimalData(dedupeShelterAnimals(result.items));
          setHasMore(result.hasMore);
          setTotalCount(result.totalCount);
        } else {
          setShelterAnimalData((prev) => {
            const newData = dedupeShelterAnimals([...prev, ...result.items]);
            setHasMore(result.hasMore);
            setTotalCount(result.totalCount);
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

  const handleFilterChange = useCallback((
    newFilters: AnimalFilterState,
    syncUrl = true,
  ) => {
    imageSearchActiveRef.current = false;
    setImageSearchActive(false);
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
      prevFilters.upr_cd !== newFilters.upr_cd ||
      prevFilters.orgNm !== newFilters.orgNm;
    const isSortChanged = prevFilters.sortOrder !== newFilters.sortOrder;
    if (!isSearchQueryChanged && !isOtherFilterChanged && !isSortChanged) {
      return;
    }

    const snap: AnimalFilterState = {
      ...newFilters,
    };
    setFilters(snap);

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = null;
    }

    const applyFilters = async () => {
      if (isFilterRequestInProgress.current) return;

      if (syncUrl) {
        const nextQuery = createFilterSearchParams(snap, listQuickFilterRef.current).toString();
        const currentQuery = searchParams.toString();
        if (nextQuery !== currentQuery) {
          router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
        }
      }

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
            pageSizeRef.current,
          );
          listQuickNextApiPageRef.current = nextPage;
          setShelterAnimalData(dedupeShelterAnimals(picked));
          setHasMore(!exhausted);
        } else {
          const result = await fetchShelterAnimalData(1, snap, undefined, pageSizeRef.current);
          const items = Array.isArray(result.items) ? result.items : [];
          setShelterAnimalData(items);
          setHasMore(result.hasMore ?? false);
          setTotalCount(result.totalCount);
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
  }, [pathname, router, searchParams]);

  const handleRemoveFilterSummary = useCallback(
    (removeKey: FilterSummaryRemoveKey) => {
      const base = filtersRef.current;
      const next: AnimalFilterState = { ...base };

      switch (removeKey) {
        case 'searchQuery':
          next.searchQuery = '';
          break;
        case 'quickFilter':
          next.quickFilter = null;
          break;
        case 'upKindCd':
          next.upKindCd = '417000';
          break;
        case 'sexCd':
          next.sexCd = null;
          break;
        case 'state':
          next.state = null;
          break;
        case 'neuterYn':
          next.neuterYn = null;
          break;
        case 'region':
          next.upr_cd = null;
          next.orgNm = null;
          break;
        case 'receiptDate':
          next.bgnde = null;
          next.endde = null;
          break;
      }

      handleFilterChange(next);
    },
    [handleFilterChange],
  );

  const handleListQuickChange = useCallback((
    next: ListQuickFilterId | null,
    syncUrl = true,
  ) => {
    imageSearchActiveRef.current = false;
    setImageSearchActive(false);
    listQuickFilterRef.current = next;
    setListQuickFilter(next);
    const base: AnimalFilterState = {
      ...filtersRef.current,
    };
    setFilters(base);

    if (syncUrl) {
      const nextQuery = createFilterSearchParams(base, next).toString();
      const currentQuery = searchParams.toString();
      if (nextQuery !== currentQuery) {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      }
    }

    if (next === null) {
      listQuickNextApiPageRef.current = 1;
      isFilterRequestInProgress.current = true;
      setPageNo(1);
      setShelterAnimalData([]);
      setHasMore(true);
      setLoading(true);
      void (async () => {
        try {
          const result = await fetchShelterAnimalData(1, base, undefined, pageSizeRef.current);
          const items = Array.isArray(result.items) ? result.items : [];
          setShelterAnimalData(items);
          setHasMore(result.hasMore ?? false);
          setTotalCount(result.totalCount);
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
          pageSizeRef.current,
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
  }, [pathname, router, searchParams]);

  const handleImageSearch = useCallback(async (file: File): Promise<boolean> => {
    const sidoCd = filtersRef.current.upr_cd ??
      sidoLocation.items.find((item) => item.SIDO_NAME === filtersRef.current.orgNm)?.SIDO_CD ??
      null;
    const upKindCd = filtersRef.current.upKindCd;
    setLoading(true);
    const matches = await searchWithFile(file, {
      sidoCd,
      petType: upKindCd === '417000' || upKindCd === '422400' ? upKindCd : '',
    });
    setLoading(false);
    if (!matches) return false;

    const animals = matches
      .map(similarMatchToShelterAnimal)
      .filter((animal): animal is ShelterAnimalItem => animal !== null);
    imageSearchActiveRef.current = true;
    setImageSearchActive(true);
    listQuickFilterRef.current = null;
    setListQuickFilter(null);
    setShelterAnimalData(dedupeShelterAnimals(animals));
    setPageNo(1);
    setHasMore(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }, [searchWithFile]);

  const handleTextSearch = useCallback(async (query: string): Promise<void> => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || textSearchLoading) return;

    setTextSearchLoading(true);
    setTextSearchError(null);
    setLoading(true);
    try {
      const animals = await searchShelterAnimalsByText(normalizedQuery, 24);
      const nextFilters = { ...filtersRef.current, searchQuery: normalizedQuery };
      filtersRef.current = nextFilters;
      setFilters(nextFilters);
      imageSearchActiveRef.current = true;
      setImageSearchActive(true);
      listQuickFilterRef.current = null;
      setListQuickFilter(null);
      setShelterAnimalData(dedupeShelterAnimals(animals));
      setPageNo(1);
      setHasMore(false);
      trackEvent('search_animal_text', {
        result_count: animals.length,
        query_length: normalizedQuery.length,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error instanceof TextSearchError && error.status === 429) {
        setTextSearchError(isEnglish
          ? 'You have reached today’s search limit. Sign in for up to 30 searches per day.'
          : '오늘의 검색 횟수를 모두 사용했습니다. 로그인하면 하루 30회까지 검색할 수 있어요.');
      } else {
        setTextSearchError(error instanceof Error
          ? error.message
          : (isEnglish ? 'Natural language search failed.' : '자연어 검색에 실패했습니다.'));
      }
    } finally {
      setLoading(false);
      setTextSearchLoading(false);
    }
  }, [isEnglish, textSearchLoading]);

  const handleResetImageSearch = useCallback(async () => {
    imageSearchActiveRef.current = false;
    setImageSearchActive(false);
    setFilterModalOpen(false);
    const nextFilters = { ...filtersRef.current, searchQuery: '' };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);
    setTextSearchError(null);
    setPageNo(1);
    setShelterAnimalData([]);
    setHasMore(true);
    setLoading(true);
    await handleFetchShelterAnimalData(1, true, nextFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [handleFetchShelterAnimalData]);

  useEffect(() => {
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }

    const q = searchParams.get('q')?.trim();
    const sex = searchParams.get('sex');
    const upkind = searchParams.get('upkind');
    const neuter = searchParams.get('neuter');
    const state = searchParams.get('state');
    const quickFilterRaw = searchParams.get('quickFilter');
    const parsedQuick = parseQuickFilterFromSearchParams(quickFilterRaw);
    const listQuickRaw = searchParams.get('listQuick');
    const parsedListQuick = parseListQuickFilter(listQuickRaw);
    const uprCd = searchParams.get('upr_cd');
    const orgNm = searchParams.get('orgNm')?.trim() || searchParams.get('org_nm')?.trim();
    const bgnde = searchParams.get('bgnde');
    const endde = searchParams.get('endde');
    const sort = searchParams.get('sort');
    const hasUrlFilterParams = Boolean(
      q || sex || upkind || neuter || state || quickFilterRaw || listQuickRaw || uprCd || orgNm || bgnde || endde || sort,
    );
    if (hasUrlFilterParams) appliedUrlQueryRef.current = true;
    const nextFilters: AnimalFilterState = {
      sortOrder: sort === 'rescue' ? 'rescue' : 'notice',
      searchQuery: q ?? '',
      sexCd: sex === 'M' || sex === 'F' || sex === 'Q' ? sex : null,
      upKindCd:
        upkind === '417000' || upkind === '422400' || upkind === '429900'
          ? upkind
          : parsedQuick === 'likesHuman' || parsedQuick === 'gentle'
            ? null
            : '417000',
      neuterYn:
        neuter === 'Y' || neuter === 'N' || neuter === 'U' ? neuter : null,
      state: state === 'notice' || state === 'protect' ? state : null,
      quickFilter: parsedQuick,
      bgnde: bgnde && /^\d{8}$/.test(bgnde) ? bgnde : null,
      endde: endde && /^\d{8}$/.test(endde) ? endde : null,
      upr_cd: uprCd && /^\d{7}$/.test(uprCd) ? uprCd : null,
      orgNm: orgNm || null,
    };
    const currentFilters = filtersRef.current;
    const regularFilterChanged =
      currentFilters.searchQuery !== nextFilters.searchQuery ||
      currentFilters.sexCd !== nextFilters.sexCd ||
      currentFilters.state !== nextFilters.state ||
      currentFilters.upKindCd !== nextFilters.upKindCd ||
      currentFilters.neuterYn !== nextFilters.neuterYn ||
      currentFilters.quickFilter !== nextFilters.quickFilter ||
      currentFilters.bgnde !== nextFilters.bgnde ||
      currentFilters.endde !== nextFilters.endde ||
      currentFilters.upr_cd !== nextFilters.upr_cd ||
      currentFilters.orgNm !== nextFilters.orgNm;
    const sortChanged = currentFilters.sortOrder !== nextFilters.sortOrder;
    const listQuickChanged = listQuickFilterRef.current !== parsedListQuick;

    if (listQuickChanged) {
      listQuickFilterRef.current = parsedListQuick;
      setListQuickFilter(parsedListQuick);
    }
    if (regularFilterChanged || sortChanged) {
      handleFilterChange(nextFilters, false);
    } else if (listQuickChanged) {
      handleListQuickChange(parsedListQuick, false);
    }
  }, [searchParams, handleFilterChange, handleListQuickChange]);

  useEffect(() => {
    if (loadedInitialRef.current || appliedUrlQueryRef.current) return;
    loadedInitialRef.current = true;
    setLoading(true);
    void handleFetchShelterAnimalData(1, true, filtersRef.current);
  }, [handleFetchShelterAnimalData]);

  const handlePageChange = useCallback(async (nextPage: number) => {
    if (nextPage < 1 || nextPage === pageNoRef.current || loading || isFilterRequestInProgress.current) return;
    isFilterRequestInProgress.current = true;
    setLoading(true);
    setShelterAnimalData([]);
    try {
      const mode = listQuickFilterRef.current;
      if (mode) {
        const { picked, nextPage: followingPage, exhausted } = await gatherListQuickMatches(
          filtersRef.current,
          mode,
          nextPage,
          new Set<string>(),
          new Date().getFullYear(),
          7,
          pageSizeRef.current,
        );
        listQuickNextApiPageRef.current = followingPage;
        setShelterAnimalData(dedupeShelterAnimals(picked));
        setHasMore(!exhausted);
      } else {
        const result = await fetchShelterAnimalData(nextPage, filtersRef.current, undefined, pageSizeRef.current);
        setShelterAnimalData(dedupeShelterAnimals(result.items));
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
      }
      setPageNo(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('페이지 이동 중 공고 조회 실패:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      isFilterRequestInProgress.current = false;
    }
  }, [loading]);

  const filterSummaryRows = useMemo(() => buildFilterSummaryRows(filters), [filters]);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const visiblePaginationItems = paginationItems(pageNo, totalPages);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl pb-4 sm:pb-5">
      <div className="flex flex-col pt-4 sm:pt-5">
        <div className="flex min-w-0 w-full flex-1 flex-col items-stretch gap-2 sm:gap-2.5">
          <AnimalFilterHeader
            filters={filters}
            onFilterChange={handleFilterChange}
            onImageSearch={handleImageSearch}
            onTextSearch={handleTextSearch}
            textSearchLoading={textSearchLoading}
            showFilters={false}
            quickFilters={(
              <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-start gap-1.5" role="group" aria-label={isEnglish ? 'Quick filters' : '빠른 찾기'}>
                {LIST_QUICK_BUTTONS.map(({ id, label }) => {
                  const active = listQuickFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleListQuickChange(active ? null : id)}
                      className={`inline-flex min-h-7 select-none items-center rounded-full border bg-transparent px-2.5 py-1.5 text-xs font-semibold leading-none tracking-tight transition active:scale-[0.98] ${active
                        ? 'border-primary1 text-primary1'
                        : 'border-[#cfc6c1] text-[#817873] hover:border-primary1/60 hover:text-[#332d2a]'
                        }`}
                    >
                      <span>{isEnglish ? ({ noticeEnding: 'Ending soon', birthYear: 'Young animals' } as Record<string, string>)[id] : label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {(imageSearchError || textSearchError) && (
            <p className="mx-auto w-full max-w-2xl text-center text-sm font-medium text-red-600">
              {imageSearchError || textSearchError}
            </p>
          )}
          {/* 입양 공고: 제목·설명·적용 필터 칩 아래에 빠른 선택 뱃지 */}
          <div className="flex w-full flex-col gap-2 px-0 pb-1 pt-0 sm:pb-4 sm:pt-7">
            <div className="flex w-full flex-row items-start justify-between gap-2 sm:items-center">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <div className={`relative shrink-0 ${filterModalOpen ? 'z-[210]' : ''}`}>
                  {imageSearchActive ? (
                    <button
                      type="button"
                      onClick={() => void handleResetImageSearch()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-[#332d2a] shadow-[0_3px_12px_rgba(51,45,42,0.12)] transition-colors hover:bg-primary-soft hover:shadow-[0_4px_14px_rgba(51,45,42,0.16)]"
                    >
                      <MdRefresh className="h-4 w-4" aria-hidden />
                      <span>{isEnglish ? 'Reset results' : '결과 초기화'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFilterModalOpen((open) => !open)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-[#332d2a] shadow-[0_3px_12px_rgba(51,45,42,0.12)] transition-colors hover:bg-primary-soft hover:shadow-[0_4px_14px_rgba(51,45,42,0.16)]"
                      aria-haspopup="dialog"
                      aria-expanded={filterModalOpen}
                    >
                      <MdTune className="h-4 w-4" aria-hidden />
                      <span>{isEnglish ? 'Filters' : '필터'}</span>
                    </button>
                  )}
                  {!imageSearchActive && filterModalOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-0 cursor-default"
                        onClick={() => setFilterModalOpen(false)}
                        aria-label={isEnglish ? 'Close filters' : '필터 닫기'}
                      />
                      <section
                        role="dialog"
                        aria-labelledby="shelter-filter-title"
                        className="absolute left-0 top-full z-10 mt-2 w-[min(34rem,calc(100vw-2rem))] rounded-[20px] border border-[#eadfd7] bg-white p-4 shadow-[0_18px_50px_rgba(51,45,42,0.18)] sm:p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h2 id="shelter-filter-title" className="text-base font-bold text-[#332d2a]">
                            {isEnglish ? 'Filter adoption listings' : '입양 공고 필터'}
                          </h2>
                          <button
                            type="button"
                            onClick={() => setFilterModalOpen(false)}
                            className="rounded-full p-1.5 text-[#817873] hover:bg-primary-soft"
                            aria-label={isEnglish ? 'Close filters' : '필터 닫기'}
                          >
                            <MdClose className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-4">
                          <AnimalFilterHeader
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onImageSearch={handleImageSearch}
                            onTextSearch={handleTextSearch}
                            textSearchLoading={textSearchLoading}
                            showSearch={false}
                            panelFilters
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setFilterModalOpen(false)}
                            className="rounded-[14px] bg-primary1 px-5 py-2 text-sm font-bold text-white hover:bg-primary2"
                          >
                            {isEnglish ? 'Done' : '완료'}
                          </button>
                        </div>
                      </section>
                    </>
                  )}
                </div>
                {filterSummaryRows.length > 0 && (
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5" role="list" aria-label={isEnglish ? 'Applied filters' : '적용된 필터'}>
                    {filterSummaryRows.map((row) => {
                      const chipClass =
                        'inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border-0 bg-primary1 px-3 text-sm font-medium text-white transition-colors hover:bg-primary2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1/30';
                      if (row.variant === 'quick') {
                        const Icon = QUICK_FILTER_ICONS[row.quick];
                        const koreanLabel = QUICK_FILTER_LABEL[row.quick];
                        const label = isEnglish ? ENGLISH_FILTER_LABEL[koreanLabel] || koreanLabel : koreanLabel;
                        return (
                          <button key={row.key} type="button" role="listitem" className={chipClass} aria-label={isEnglish ? `Remove ${label} filter` : `${label} 필터 제거`} onClick={() => handleRemoveFilterSummary(row.removeKey)}>
                            <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                            <span className="truncate">{label}</span>
                            <MdClose className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                          </button>
                        );
                      }
                      return (
                        <button key={row.key} type="button" role="listitem" className={chipClass} aria-label={isEnglish ? `Remove ${ENGLISH_FILTER_LABEL[row.text] || row.text} filter` : `${row.text} 필터 제거`} onClick={() => handleRemoveFilterSummary(row.removeKey)}>
                          <span className="truncate">{isEnglish ? ENGLISH_FILTER_LABEL[row.text] || row.text : row.text}</span>
                          <MdClose className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {!imageSearchActive && <div className={`relative shrink-0 ${sortOpen ? 'z-[210]' : ''}`}>
                <button
                  type="button"
                  onClick={() => setSortOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  className="flex h-9 min-w-[112px] items-center justify-between gap-1.5 rounded-lg border border-[#eadfd7] bg-white px-2.5 text-xs font-medium text-[#332d2a] transition-colors hover:border-primary1/60 hover:bg-primary-soft sm:min-w-[132px] sm:text-sm"
                >
                  <span>{filters.sortOrder === 'rescue' ? (isEnglish ? 'Newest rescues' : '구조 최신순') : (isEnglish ? 'Newest notices' : '공고 최신순')}</span>
                  <MdArrowDropDown className={`h-4 w-4 shrink-0 transition-transform ${sortOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {sortOpen && <>
                  <button type="button" className="fixed inset-0 z-0 cursor-default" onClick={() => setSortOpen(false)} aria-label={isEnglish ? 'Close sort menu' : '정렬 메뉴 닫기'} />
                  <div role="listbox" aria-label={isEnglish ? 'Sort adoption listings' : '공고 정렬'} className="absolute right-0 top-full z-10 mt-1 w-full min-w-[132px] rounded-2xl border border-gray-200/90 bg-white p-1.5 shadow-xl">
                    {(['notice', 'rescue'] as const).map((sortOrder) => {
                      const selected = filters.sortOrder === sortOrder;
                      const label = sortOrder === 'notice'
                        ? (isEnglish ? 'Newest notices' : '공고 최신순')
                        : (isEnglish ? 'Newest rescues' : '구조 최신순');
                      return <button
                        key={sortOrder}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setSortOpen(false);
                          handleFilterChange({ ...filters, sortOrder });
                        }}
                        className={`block w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${selected ? 'bg-primary1 text-white' : 'text-[#332d2a] hover:bg-gray-100'}`}
                      >{label}</button>;
                    })}
                  </div>
                </>}
              </div>}
            </div>
          </div>

          {shelterAnimalData.length === 0 && !loading && !hasMore ? (
            <div className="my-4 rounded-[20px] border border-dashed border-[#d9d0cb] bg-white/70 px-6 py-16 text-center text-[#817873] sm:py-20">
              {isEnglish ? 'No shelter animals found.' : '유기동물 데이터가 없습니다.'}
            </div>
          ) : (
            <>
              <div className="mx-auto w-full min-w-0 ">
                {loading && shelterAnimalData.length === 0 ? (
                  <div
                    className="grid grid-cols-1 justify-items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                    role="list"
                    aria-busy="true"
                    aria-label={isEnglish ? 'Loading adoption listings' : '입양 공고 목록 불러오는 중'}
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
                      className="grid grid-cols-1 justify-items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                      role="list"
                      aria-label={isEnglish ? 'Adoption listings' : '입양 공고 목록'}
                    >
                      {shelterAnimalData.map((item, index) => (
                        <div
                          key={`${item.desertionNo}-${item.noticeNo ?? index}`}
                          role="listitem"
                          className="min-w-0"
                        >
                          <AbandonedCard shelterAnimal={item} priority={index === 0} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : !loading && hasMore ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-gray-600 sm:py-14">
                    <p className="max-w-md leading-relaxed">
                      {isEnglish ? 'No matching listings were found on this page.' : '현재 페이지에는 조건에 맞는 공고가 없습니다.'}
                    </p>
                  </div>
                ) : null}
              </div>
              {!imageSearchActive && !loading && totalPages > 1 && <nav className="py-8" aria-label={isEnglish ? 'Adoption listing pages' : '공고 페이지'}>
                <div className="flex items-center justify-center gap-3 sm:hidden">
                  <button type="button" disabled={pageNo <= 1} onClick={() => void handlePageChange(pageNo - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd7] bg-white text-xl text-[#5f5752] transition hover:border-primary1/60 hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" aria-label={isEnglish ? 'Previous page' : '이전 페이지'}><MdChevronLeft aria-hidden /></button>
                  <button type="button" disabled={pageNo >= totalPages} onClick={() => void handlePageChange(pageNo + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd7] bg-white text-xl text-[#5f5752] transition hover:border-primary1/60 hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" aria-label={isEnglish ? 'Next page' : '다음 페이지'}><MdChevronRight aria-hidden /></button>
                </div>
                <div className="hidden items-center justify-center gap-1.5 sm:flex">
                  <button type="button" disabled={pageNo <= 1} onClick={() => void handlePageChange(pageNo - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd7] bg-white text-xl text-[#5f5752] transition hover:border-primary1/60 hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" aria-label={isEnglish ? 'Previous page' : '이전 페이지'}><MdChevronLeft aria-hidden /></button>
                  {visiblePaginationItems.map((item) => typeof item === 'number' ? <span key={item} aria-current={item === pageNo ? 'page' : undefined} className={`flex h-10 min-w-8 items-center justify-center px-1 text-sm font-bold ${item === pageNo ? 'text-primary1' : 'text-[#817873]'}`}>{item}</span> : <span key={item} className="flex h-10 min-w-5 items-center justify-center text-[#9a918b]" aria-hidden>…</span>)}
                  <button type="button" disabled={pageNo >= totalPages} onClick={() => void handlePageChange(pageNo + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfd7] bg-white text-xl text-[#5f5752] transition hover:border-primary1/60 hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" aria-label={isEnglish ? 'Next page' : '다음 페이지'}><MdChevronRight aria-hidden /></button>
                </div>
              </nav>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
