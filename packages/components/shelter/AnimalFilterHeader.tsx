'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  MdArrowDropDown,
  MdCheck,
  MdSearch,
} from 'react-icons/md';
import Image from 'next/image';
import { RiResetLeftFill } from 'react-icons/ri';
import { getSidoDisplayName } from '@/packages/utils/locationUtils';
import type { QuickFilterKey, ShelterSortOrder } from '@/lib/client/shelter';
import { sidoLocation } from '@/static/data/sidoLocation';
import { useLanguage } from '@/lib/i18n/language';
import ImageSearchButton from './ImageSearchButton';

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

function dashYmdToDotLabel(isoDash: string): string | null {
  if (!isoDash || isoDash.length < 10) return null;
  const [y, m, d] = isoDash.split('-');
  if (!y || !m || !d) return null;
  return `${y}.${m}.${d}`;
}

function getDateRangeSummaryLabel(startDash: string, endDash: string): string {
  const a = dashYmdToDotLabel(startDash);
  const b = dashYmdToDotLabel(endDash);
  if (!a && !b) return '기간 선택';
  if (a && b) return `${a} ~ ${b}`;
  if (a) return `${a} ~ …`;
  return `… ~ ${b!}`;
}

const sexOptions = [
  { value: null, label: '전체' },
  { value: 'F', label: '여자' },
  { value: 'M', label: '남자' },
  { value: 'Q', label: '미상' },
];

const animalTypeOptions = [
  { value: '417000', label: '강아지', englishLabel: 'Dogs' },
  { value: '422400', label: '고양이', englishLabel: 'Cats' },
  { value: '429900', label: '기타', englishLabel: 'Other' },
] as const;

/** AnimalFilterHeader 전용 — 검색(더 높게) / 필터 pill(더 낮게) */
const searchBarWrapClass =
  'flex min-h-[54px] w-full max-w-2xl min-w-0 items-center gap-2 rounded-full border border-primary1/40 bg-white px-3 transition hover:border-primary1/65 focus-within:border-primary1 focus-within:ring-2 focus-within:ring-primary1/15 sm:px-5';
const searchInputClass =
  'h-12 min-w-0 flex-1 bg-transparent py-2 text-sm text-[#332d2a] outline-none placeholder:text-[#a69d98] sm:text-base';

const filterRowClass =
  'mx-auto flex w-full max-w-3xl min-w-0 flex-col justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-stretch';
const filterPillButtonClass =
  'flex w-full min-h-9 items-center justify-between gap-1.5 px-2.5 py-1 min-w-0 text-xs font-medium text-[#332d2a] bg-white border border-[#eadfd7] rounded-lg hover:border-primary1/60 hover:bg-primary-soft transition-colors';
const filterPillLeadClass = 'flex items-center gap-1.5 min-w-0 sm:gap-2';
const filterChevronClass = 'h-4 w-4 shrink-0 transition-transform';
const filterDropdownRootClass = 'relative w-full min-w-0 sm:w-32';
// 모바일에서는 필터 행 전체를 날짜 팝오버의 위치 기준으로 사용해 화면 밖으로
// 밀려나지 않게 하고, 데스크톱에서는 날짜 버튼을 기준으로 배치한다.
const filterDateFieldWrapClass = 'static w-full min-w-0 sm:relative sm:w-72';
const filterDropdownMenuBaseClass =
  'absolute left-0 top-full z-10 mt-2 min-w-[150px] w-full overflow-hidden rounded-xl border border-[#dedede] bg-white p-0 shadow-[0_8px_24px_rgba(51,45,42,0.14)] divide-y divide-[#ece8e5]';
const filterDropdownMenuScrollableClass = `${filterDropdownMenuBaseClass} max-h-[min(60vh,22rem)] overflow-y-auto`;
const filterDropdownOptionClass =
  'flex min-h-10 cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors';
const filterDropdownOptionSelectedClass = 'bg-primary-soft/60 font-semibold text-primary1';
const filterDropdownOptionIdleClass = 'bg-white text-[#332d2a] hover:bg-[#faf8f7]';
const datePopoverInputClass =
  'w-full min-h-[44px] rounded-xl border border-gray-300 bg-gray-100 px-3 text-sm text-gray-900 focus:border-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/25 [color-scheme:light]';
const datePopoverLabelClass = 'mb-1.5 block text-xs font-semibold text-gray-600';
const filterResetButtonClass =
  'w-full shrink-0 min-h-9 sm:w-auto sm:flex-none px-2.5 py-1 text-xs font-medium text-gray-700 border border-slate-200 bg-white flex items-center justify-center gap-1.5 hover:bg-gray-50 rounded-lg transition-colors';

function filterDropdownOptionStateClass(selected: boolean): string {
  return `${filterDropdownOptionClass} ${selected ? filterDropdownOptionSelectedClass : filterDropdownOptionIdleClass}`;
}

export interface AnimalFilterState {
  sortOrder: ShelterSortOrder;
  sexCd: string | null;
  state: string | null;
  upKindCd: string | null;
  neuterYn: string | null;
  quickFilter: QuickFilterKey | null;
  searchQuery: string;
  bgnde: string | null;
  endde: string | null;
  upr_cd: string | null;
  orgNm?: string | null;
}

interface AnimalFilterHeaderProps {
  filters: AnimalFilterState;
  onFilterChange: (filters: AnimalFilterState) => void;
  onImageSearch: (file: File) => Promise<boolean>;
  onTextSearch?: (query: string) => Promise<void>;
  textSearchLoading?: boolean;
  quickFilters?: ReactNode;
  showSearch?: boolean;
  showFilters?: boolean;
  compactFilters?: boolean;
  panelFilters?: boolean;
  aiFilterMode?: 'text' | 'image';
  textSearchRemaining?: number | null;
  imageSearchRemaining?: number | null;
}

export default function AnimalFilterHeader({
  filters,
  onFilterChange,
  onImageSearch,
  onTextSearch,
  textSearchLoading = false,
  quickFilters,
  showSearch = true,
  showFilters = true,
  compactFilters = false,
  panelFilters = false,
  aiFilterMode,
  textSearchRemaining,
  imageSearchRemaining,
}: AnimalFilterHeaderProps) {
  const { isEnglish } = useLanguage();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [sidoList, setSidoList] = useState<SidoItem[]>([]);
  const [textQuery, setTextQuery] = useState(filters.searchQuery);
  const [searchMode, setSearchMode] = useState<'general' | 'ai'>('general');

  useEffect(() => {
    queueMicrotask(() => setTextQuery(filters.searchQuery));
  }, [filters.searchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem('sido_data');
        if (!raw) {
          setSidoList(sidoLocation.items ?? []);
          return;
        }
        const parsed = JSON.parse(raw) as SidoItem[];
        setSidoList(Array.isArray(parsed) && parsed.length > 0 ? parsed : sidoLocation.items ?? []);
      } catch {
        setSidoList(sidoLocation.items ?? []);
      }
    });
  }, []);

  useEffect(() => {
    if (!openDropdown && !dateRangeOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest('[data-filter-dropdown-root]')) {
        setOpenDropdown(null);
        setDateRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [openDropdown, dateRangeOpen]);

  const derivedStartDate = useMemo(() => {
    if (filters.bgnde && filters.bgnde.length === 8) {
      return `${filters.bgnde.substring(0, 4)}-${filters.bgnde.substring(4, 6)}-${filters.bgnde.substring(6, 8)}`;
    }
    return '';
  }, [filters.bgnde]);

  const derivedEndDate = useMemo(() => {
    if (filters.endde && filters.endde.length === 8) {
      return `${filters.endde.substring(0, 4)}-${filters.endde.substring(4, 6)}-${filters.endde.substring(6, 8)}`;
    }
    return '';
  }, [filters.endde]);

  const [startDate, setStartDate] = useState<string>(derivedStartDate);
  const [endDate, setEndDate] = useState<string>(derivedEndDate);
  const [prevBgnde, setPrevBgnde] = useState(filters.bgnde);
  const [prevEndde, setPrevEndde] = useState(filters.endde);

  // Sync local state when filters change externally (e.g., reset button)
  if (filters.bgnde !== prevBgnde) {
    setPrevBgnde(filters.bgnde);
    setStartDate(derivedStartDate);
  }
  if (filters.endde !== prevEndde) {
    setPrevEndde(filters.endde);
    setEndDate(derivedEndDate);
  }

  const handleFilterChange = (key: keyof AnimalFilterState, value: string | null) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
    setOpenDropdown(null);
    setDateRangeOpen(false);
  };

  const handleRegionFilterChange = (sido: SidoItem | null) => {
    onFilterChange({
      ...filters,
      upr_cd: null,
      orgNm: sido?.SIDO_NAME ?? null,
    });
    setOpenDropdown(null);
    setDateRangeOpen(false);
  };

  const submitTextSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = textQuery.trim();
    if (!query || textSearchLoading) return;
    if (searchMode === 'ai') {
      if (onTextSearch) void onTextSearch(query);
      return;
    }
    onFilterChange({ ...filters, searchQuery: query });
  };

  const formatDateToYYYYMMDD = (dateString: string): string | null => {
    if (!dateString) return null;
    return dateString.replace(/-/g, '');
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setStartDate(dateValue);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setEndDate(dateValue);
  };

  const commitDateRange = useCallback(() => {
    if (startDate && endDate && startDate > endDate) return;
    const bgnde = formatDateToYYYYMMDD(startDate);
    const endde = formatDateToYYYYMMDD(endDate);
    onFilterChange({ ...filters, bgnde, endde });
    setDateRangeOpen(false);
  }, [filters, startDate, endDate, onFilterChange]);

  const applyRecentDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    const toLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const nextStartDate = toLocalDate(start);
    const nextEndDate = toLocalDate(end);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    onFilterChange({
      ...filters,
      bgnde: formatDateToYYYYMMDD(nextStartDate),
      endde: formatDateToYYYYMMDD(nextEndDate),
    });
    setDateRangeOpen(false);
  }, [filters, onFilterChange]);

  const clearDateRangeInPopover = useCallback(() => {
    setStartDate('');
    setEndDate('');
    onFilterChange({ ...filters, bgnde: null, endde: null });
    setDateRangeOpen(false);
  }, [filters, onFilterChange]);

  const getSexFilterLabel = (): string => {
    const selected = sexOptions.find((opt) => opt.value === filters.sexCd);
    if (!isEnglish) return selected?.label || '전체';
    return ({ F: 'Female', M: 'Male', Q: 'Unknown' } as Record<string, string>)[filters.sexCd ?? ''] || 'All';
  };

  const getAnimalTypeLabel = (): string => {
    const selected = animalTypeOptions.find((option) => option.value === filters.upKindCd);
    if (!selected) return isEnglish ? 'Dogs' : '강아지';
    return isEnglish ? selected.englishLabel : selected.label;
  };

  const getRegionFilterLabel = (): string => {
    if (filters.orgNm?.trim()) return getSidoDisplayName(filters.orgNm.trim(), isEnglish);
    if (!filters.upr_cd) return isEnglish ? 'All Korea' : '전국';
    const hit = sidoList.find((s) => s.SIDO_CD === filters.upr_cd);
    return hit ? getSidoDisplayName(hit.SIDO_NAME, isEnglish) : (isEnglish ? 'All Korea' : '전국');
  };

  const hasSidoList = sidoList.length > 0;
  const invalidDateRange = Boolean(startDate && endDate && startDate > endDate);

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          {showSearch && <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col items-stretch gap-4">
            <div className="relative flex h-16 w-full items-end justify-center sm:h-20">
              <Image
                src="/static/images/findme-search-dog.png"
                alt=""
                width={80}
                height={80}
                className="pointer-events-none absolute bottom-0 left-0 h-14 w-14 object-contain sm:h-20 sm:w-20"
              />
            <div
              className="grid h-14 w-full max-w-[230px] grid-cols-3 gap-2 self-center text-[9px] font-bold sm:text-[10px]"
              role="radiogroup"
              aria-label={isEnglish ? 'Animal type' : '축종'}
            >
              <button
                type="button"
                role="radio"
                aria-checked={!filters.upKindCd || filters.upKindCd === '417000'}
                aria-label={isEnglish ? 'Dogs' : '강아지'}
                title={isEnglish ? 'Dogs' : '강아지'}
                onClick={() => handleFilterChange('upKindCd', '417000')}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-[14px] border bg-white transition-all active:translate-y-0.5 active:shadow-sm ${!filters.upKindCd || filters.upKindCd === '417000' ? 'border-primary1/60 text-primary1 shadow-[0_3px_0_rgba(255,90,72,0.28),0_6px_12px_rgba(51,45,42,0.10)]' : 'border-[#eadfd7] text-[#9a918b] shadow-[0_3px_0_#ddd3cd,0_6px_12px_rgba(51,45,42,0.08)]'}`}
              >
                <Image src="/static/images/findme-dog.png" alt="" width={32} height={32} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
                <span>{isEnglish ? 'Dogs' : '강아지'}</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={filters.upKindCd === '422400'}
                aria-label={isEnglish ? 'Cats' : '고양이'}
                title={isEnglish ? 'Cats' : '고양이'}
                onClick={() => handleFilterChange('upKindCd', '422400')}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-[14px] border bg-white transition-all active:translate-y-0.5 active:shadow-sm ${filters.upKindCd === '422400' ? 'border-primary1/60 text-primary1 shadow-[0_3px_0_rgba(255,90,72,0.28),0_6px_12px_rgba(51,45,42,0.10)]' : 'border-[#eadfd7] text-[#9a918b] shadow-[0_3px_0_#ddd3cd,0_6px_12px_rgba(51,45,42,0.08)]'}`}
              >
                <Image src="/static/images/findme-cat.png" alt="" width={32} height={32} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
                <span>{isEnglish ? 'Cats' : '고양이'}</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={filters.upKindCd === '429900'}
                aria-label={isEnglish ? 'Other animals' : '기타 축종'}
                title={isEnglish ? 'Other animals' : '기타 축종'}
                onClick={() => handleFilterChange('upKindCd', '429900')}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-[14px] border bg-white transition-all active:translate-y-0.5 active:shadow-sm ${filters.upKindCd === '429900' ? 'border-primary1/60 text-primary1 shadow-[0_3px_0_rgba(255,90,72,0.28),0_6px_12px_rgba(51,45,42,0.10)]' : 'border-[#eadfd7] text-[#9a918b] shadow-[0_3px_0_#ddd3cd,0_6px_12px_rgba(51,45,42,0.08)]'}`}
              >
                <Image src="/static/images/findme-other-animals.png" alt="" width={32} height={32} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
                <span>{isEnglish ? 'Other' : '기타 축종'}</span>
              </button>
            </div>
              <Image
                src="/static/images/findme-search-cat.png"
                alt=""
                width={80}
                height={80}
                className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 object-contain sm:h-20 sm:w-20"
              />
            </div>
            <form className={`${searchBarWrapClass} flex-1`} onSubmit={submitTextSearch}>
            <div className="relative grid h-8 w-[76px] shrink-0 grid-cols-2 rounded-full bg-[#f1eeeb] p-0.5 text-[9px] font-bold sm:w-[88px] sm:text-[10px]" role="group" aria-label={isEnglish ? 'Search mode' : '검색 모드'}>
              <span className={`pointer-events-none absolute bottom-0.5 top-0.5 w-9 rounded-full bg-white shadow-sm transition-transform duration-200 sm:w-[42px] ${searchMode === 'ai' ? 'translate-x-[38px] sm:translate-x-[44px]' : 'translate-x-0.5'}`} aria-hidden />
              <button type="button" onClick={() => setSearchMode('general')} aria-pressed={searchMode === 'general'} className={`relative z-10 rounded-full transition ${searchMode === 'general' ? 'text-[#332d2a]' : 'text-[#9a918b]'}`}>{isEnglish ? 'Basic' : '일반'}</button>
              <button type="button" onClick={() => setSearchMode('ai')} aria-pressed={searchMode === 'ai'} className={`relative z-10 rounded-full transition ${searchMode === 'ai' ? 'text-primary1' : 'text-[#9a918b]'} ${textSearchLoading && searchMode === 'ai' ? 'animate-pulse' : ''}`}>AI</button>
            </div>
            <input
              type="text"
              value={textQuery}
              onChange={(event) => setTextQuery(event.target.value)}
              placeholder={searchMode === 'ai'
                ? (isEnglish ? 'Search with AI' : 'AI로 검색해보세요')
                : (isEnglish ? 'Search breed, shelter, or features' : '품종, 보호소, 특징을 검색해보세요')}
              className={searchInputClass}
            />
            <button type="submit" disabled={!textQuery.trim() || textSearchLoading} className="ml-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent text-primary1 transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-45" aria-label={isEnglish ? 'Search' : '검색'}><MdSearch className={`h-5 w-5 ${textSearchLoading ? 'animate-pulse' : ''}`} aria-hidden /></button>
            <ImageSearchButton onSearch={onImageSearch} />
            </form>
            {searchMode === 'ai' && (
              <p className="text-center text-[10px] font-medium text-[#9a918b] sm:text-xs">
                {isEnglish
                  ? `Text searches ${textSearchRemaining ?? '-'} left · Image searches ${imageSearchRemaining ?? '-'} left`
                  : `텍스트 검색 ${textSearchRemaining ?? '-'}회 남음 · 사진 검색 ${imageSearchRemaining ?? '-'}회 남음`}
              </p>
            )}
          </div>}

          {showSearch && quickFilters}

          {showFilters && <div className={`relative ${panelFilters ? 'grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:[&>[data-filter-dropdown-root]]:!w-full' : compactFilters ? 'flex w-full min-w-0 flex-wrap items-center gap-y-2 [&>[data-filter-dropdown-root]]:-ml-px [&>[data-filter-dropdown-root]]:!w-1/4 sm:[&>[data-filter-dropdown-root]]:!w-auto [&>[data-filter-dropdown-root]:first-child]:ml-0 [&>[data-filter-dropdown-root]>button]:min-h-10 [&>[data-filter-dropdown-root]>button]:gap-0.5 [&>[data-filter-dropdown-root]>button]:rounded-none [&>[data-filter-dropdown-root]>button]:px-1 [&>[data-filter-dropdown-root]>button]:text-[11px] sm:[&>[data-filter-dropdown-root]>button]:gap-1.5 sm:[&>[data-filter-dropdown-root]>button]:px-3 sm:[&>[data-filter-dropdown-root]>button]:text-xs [&>[data-filter-dropdown-root]>button>svg]:h-3.5 [&>[data-filter-dropdown-root]>button>svg]:w-3.5 sm:[&>[data-filter-dropdown-root]>button>svg]:h-4 sm:[&>[data-filter-dropdown-root]>button>svg]:w-4 [&>[data-filter-dropdown-root]:first-child>button]:rounded-l-xl [&>[data-filter-dropdown-root]:last-of-type>button]:rounded-r-xl [&>button]:!ml-0 sm:[&>button]:!ml-2 [&>button]:!w-auto' : filterRowClass}`}>
            {aiFilterMode !== 'image' && <>
            {/* 축종 */}
            <div className={`${filterDropdownRootClass} ${openDropdown === 'upKindCd' ? 'z-[120]' : 'z-0'}`} data-filter-dropdown-root>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={openDropdown === 'upKindCd'}
                onClick={() => {
                  setDateRangeOpen(false);
                  setOpenDropdown(openDropdown === 'upKindCd' ? null : 'upKindCd');
                }}
                className={filterPillButtonClass}
              >
                <span className={filterPillLeadClass}>
                  <span className="truncate">{getAnimalTypeLabel()}</span>
                </span>
                <MdArrowDropDown className={`${filterChevronClass} ${openDropdown === 'upKindCd' ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {openDropdown === 'upKindCd' && (
                <ul className={filterDropdownMenuBaseClass} role="listbox" aria-label={isEnglish ? 'Animal type' : '축종 목록'}>
                  {animalTypeOptions.map((option) => (
                    <li key={option.value} role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={filters.upKindCd === option.value}
                        className={`${filterDropdownOptionStateClass(filters.upKindCd === option.value)} w-full text-left`}
                        onClick={() => handleFilterChange('upKindCd', option.value)}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${filters.upKindCd === option.value ? 'border-primary1 bg-primary1 text-white' : 'border-[#cfcac7] bg-white'}`}>
                          {filters.upKindCd === option.value && <MdCheck className="h-3.5 w-3.5" aria-hidden />}
                        </span>
                        {isEnglish ? option.englishLabel : option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </>}

            {aiFilterMode !== 'text' && <>
            {/* 성별 */}
            <div className={`${filterDropdownRootClass} ${openDropdown === 'sexCd' ? 'z-[120]' : 'z-0'}`} data-filter-dropdown-root>
              <button
                type="button"
                onClick={() => {
                  setDateRangeOpen(false);
                  setOpenDropdown(openDropdown === 'sexCd' ? null : 'sexCd');
                }}
                className={filterPillButtonClass}
              >
                <span className={filterPillLeadClass}>
                  <span className="truncate">{getSexFilterLabel()}</span>
                </span>
                <MdArrowDropDown
                  className={`${filterChevronClass} ${openDropdown === 'sexCd' ? 'rotate-180' : ''}`}
                />
              </button>
              {openDropdown === 'sexCd' && (
                <ul className={filterDropdownMenuBaseClass}>
                  {sexOptions.map((option) => (
                    <li key={option.value || 'all'}>
                      <button
                        type="button"
                        className={`${filterDropdownOptionStateClass(filters.sexCd === option.value)} w-full text-left`}
                        onClick={() => handleFilterChange('sexCd', option.value)}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${filters.sexCd === option.value ? 'border-primary1 bg-primary1 text-white' : 'border-[#cfcac7] bg-white'}`}>
                          {filters.sexCd === option.value && <MdCheck className="h-3.5 w-3.5" aria-hidden />}
                        </span>
                        {isEnglish ? ({ F: 'Female', M: 'Male', Q: 'Unknown' } as Record<string, string>)[option.value ?? ''] || 'All' : option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </>}

            {/* 지역 (시도) */}
            {hasSidoList && (
              <div className={`${filterDropdownRootClass} ${openDropdown === 'upr_cd' ? 'z-[120]' : 'z-0'}`} data-filter-dropdown-root>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={openDropdown === 'upr_cd'}
                  aria-label={`${isEnglish ? 'Region' : '지역'} · ${getRegionFilterLabel()}`}
                  onClick={() => {
                    setDateRangeOpen(false);
                    setOpenDropdown(openDropdown === 'upr_cd' ? null : 'upr_cd');
                  }}
                  className={filterPillButtonClass}
                >
                  <span className={filterPillLeadClass}>
                    <span className="truncate">{getRegionFilterLabel()}</span>
                  </span>
                  <MdArrowDropDown
                    className={`${filterChevronClass} ${openDropdown === 'upr_cd' ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {openDropdown === 'upr_cd' && (
                  <ul
                    className={filterDropdownMenuScrollableClass}
                    role="listbox"
                    aria-label={isEnglish ? 'Region list' : '시도 목록'}
                  >
                    <li role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={!filters.upr_cd && !filters.orgNm}
                        className={`${filterDropdownOptionStateClass(!filters.upr_cd && !filters.orgNm)} w-full text-left`}
                        onClick={() => handleRegionFilterChange(null)}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${!filters.upr_cd && !filters.orgNm ? 'border-primary1 bg-primary1 text-white' : 'border-[#cfcac7] bg-white'}`}>
                          {!filters.upr_cd && !filters.orgNm && <MdCheck className="h-3.5 w-3.5" aria-hidden />}
                        </span>
                        {isEnglish ? 'All Korea' : '전국'}
                      </button>
                    </li>
                    {sidoList.map((sido) => (
                      <li key={sido.SIDO_CD} role="none">
                        <button
                          type="button"
                          role="option"
                          aria-selected={filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD}
                          className={`${filterDropdownOptionStateClass(filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD)} w-full text-left`}
                          onClick={() => handleRegionFilterChange(sido)}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD ? 'border-primary1 bg-primary1 text-white' : 'border-[#cfcac7] bg-white'}`}>
                            {(filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD) && <MdCheck className="h-3.5 w-3.5" aria-hidden />}
                          </span>
                          {getSidoDisplayName(sido.SIDO_NAME, isEnglish)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!aiFilterMode && <>
            {/* 접수일: 한 컨트롤에서 from~to (팝오버) — 가로 2비율 */}
            <div className={`${filterDateFieldWrapClass} ${dateRangeOpen ? 'z-[120]' : 'z-0'}`} data-filter-dropdown-root>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(null);
                  setDateRangeOpen((open) => !open);
                }}
                className={filterPillButtonClass}
              >
                <span className={filterPillLeadClass}>
                  <span className="truncate text-left">
                    {startDate || endDate ? getDateRangeSummaryLabel(startDate, endDate) : (isEnglish ? 'Select dates' : '기간 선택')}
                  </span>
                </span>
                <MdArrowDropDown
                  className={`${filterChevronClass} ${dateRangeOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {dateRangeOpen && (
                <div className="absolute right-0 top-full z-[100] mt-1 w-[min(100vw-2rem,23rem)] rounded-2xl border border-gray-200/95 bg-white p-4 shadow-xl outline-none">
                  <p className="text-sm font-bold text-[#332d2a]">{isEnglish ? 'Choose a date range' : '기간 선택'}</p>
                  <p className="mt-1 text-xs text-[#817873]">{isEnglish ? 'Quickly select a recent period or enter dates.' : '최근 기간을 빠르게 선택하거나 날짜를 직접 입력하세요.'}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[{ days: 1, ko: '오늘', en: 'Today' }, { days: 7, ko: '최근 7일', en: '7 days' }, { days: 30, ko: '최근 30일', en: '30 days' }].map((option) => (
                      <button key={option.days} type="button" onClick={() => applyRecentDateRange(option.days)} className="min-h-9 rounded-xl border border-[#eadfd7] bg-white px-2 text-xs font-semibold text-[#5f5752] transition hover:border-primary1/60 hover:bg-primary-soft hover:text-primary1">
                        {isEnglish ? option.en : option.ko}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label>
                      <span className={datePopoverLabelClass}>{isEnglish ? 'Start date' : '시작일'}</span>
                      <input type="date" value={startDate} max={endDate || undefined} onChange={handleStartDateChange} className={datePopoverInputClass} />
                    </label>
                    <label>
                      <span className={datePopoverLabelClass}>{isEnglish ? 'End date' : '종료일'}</span>
                      <input type="date" value={endDate} min={startDate || undefined} onChange={handleEndDateChange} className={datePopoverInputClass} />
                    </label>
                  </div>
                  {invalidDateRange && <p className="mt-2 text-xs font-medium text-red-600">{isEnglish ? 'The end date must be on or after the start date.' : '종료일은 시작일보다 빠를 수 없습니다.'}</p>}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#eee7e2] pt-3">
                    <button
                      type="button"
                      onClick={clearDateRangeInPopover}
                      className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#817873] hover:bg-gray-100"
                    >
                      {isEnglish ? 'Clear' : '기간 지우기'}
                    </button>
                    <button
                      type="button"
                      onClick={commitDateRange}
                      disabled={invalidDateRange || (!startDate && !endDate)}
                      className="min-h-10 rounded-xl bg-primary1 px-5 text-sm font-semibold text-white transition hover:bg-primary2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isEnglish ? 'Apply' : '적용'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 필터 초기화 */}
            {(filters.sexCd !== null || filters.state !== null || (filters.upKindCd !== null && filters.upKindCd !== '417000') || filters.neuterYn !== null || filters.quickFilter !== null || filters.searchQuery || filters.bgnde || filters.endde || filters.upr_cd || filters.orgNm) && (<>
              {compactFilters && <span className="h-0 basis-full sm:hidden" aria-hidden />}
              <button
                type="button"
                onClick={() => {
                  const resetFilters = { sortOrder: filters.sortOrder, sexCd: null, state: null, upKindCd: '417000', neuterYn: null, quickFilter: null, searchQuery: '', bgnde: null, endde: null, upr_cd: null, orgNm: null };
                  onFilterChange(resetFilters);
                  setStartDate('');
                  setEndDate('');
                  setDateRangeOpen(false);
                }}
                className={filterResetButtonClass}
              >
                <RiResetLeftFill className="w-4 h-4 shrink-0" />
                {isEnglish ? 'Reset filters' : '필터 초기화'}
              </button>
            </>)}
            </>}
          </div>}
        </div>
      </div>
    </div>
  );
}
