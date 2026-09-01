'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  MdArrowDropDown,
} from 'react-icons/md';
import Image from 'next/image';
import { RiResetLeftFill } from 'react-icons/ri';
import { getSidoDisplayName } from '@/packages/utils/locationUtils';
import type { QuickFilterKey } from '@/lib/client/shelter';
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
  'mx-auto flex min-h-[54px] w-full max-w-2xl min-w-0 items-center rounded-full border border-primary1/40 bg-white px-3 transition hover:border-primary1/65 focus-within:border-primary1 focus-within:ring-2 focus-within:ring-primary1/15 sm:px-5';
const searchInputClass =
  'h-12 min-w-0 flex-1 bg-transparent py-2 text-base text-[#332d2a] outline-none placeholder:text-[#a69d98]';

const filterRowClass =
  'mx-auto flex w-full max-w-3xl min-w-0 flex-col justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-stretch';
const filterPillButtonClass =
  'flex w-full min-h-9 items-center justify-between gap-1.5 px-2.5 py-1 min-w-0 text-xs font-medium text-[#332d2a] bg-white border border-[#eadfd7] rounded-lg hover:border-primary1/60 hover:bg-primary-soft transition-colors';
const filterPillLeadClass = 'flex items-center gap-1.5 min-w-0 sm:gap-2';
const filterChevronClass = 'h-4 w-4 shrink-0 transition-transform';
const filterDropdownRootClass = 'relative w-full min-w-0 sm:w-32';
const filterDateFieldWrapClass = 'relative w-full min-w-0 sm:w-72';
const filterDropdownMenuBaseClass =
  'absolute right-0 top-full z-10 mt-1 min-w-[88px] w-full rounded-2xl border border-gray-200/90 bg-white px-1.5 py-1.5 shadow-xl';
const filterDropdownMenuScrollableClass = `${filterDropdownMenuBaseClass} max-h-[min(60vh,22rem)] overflow-y-auto`;
const filterDropdownOptionClass =
  'cursor-pointer rounded-xl px-3 py-2.5 text-sm transition-colors';
const filterDropdownOptionSelectedClass = 'bg-primary1 text-white';
const filterDropdownOptionIdleClass = 'hover:bg-gray-100';
const datePopoverInputClass =
  'w-full min-h-[44px] rounded-xl border border-gray-300 bg-gray-100 px-3 text-sm text-gray-900 focus:border-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/25 [color-scheme:light]';
const datePopoverLabelClass = 'text-xs font-semibold text-gray-600 mb-1.5';
const datePopoverLabelEndClass = 'text-xs font-semibold text-gray-600 mt-3 mb-1.5';
const filterResetButtonClass =
  'w-full shrink-0 min-h-9 sm:w-auto sm:flex-none px-2.5 py-1 text-xs font-medium text-gray-700 border border-slate-200 bg-white flex items-center justify-center gap-1.5 hover:bg-gray-50 rounded-lg transition-colors';

function filterDropdownOptionStateClass(selected: boolean): string {
  return `${filterDropdownOptionClass} ${selected ? filterDropdownOptionSelectedClass : filterDropdownOptionIdleClass}`;
}

export interface AnimalFilterState {
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
  quickFilters?: ReactNode;
  showSearch?: boolean;
  showFilters?: boolean;
  compactFilters?: boolean;
  panelFilters?: boolean;
}

export default function AnimalFilterHeader({
  filters,
  onFilterChange,
  onImageSearch,
  quickFilters,
  showSearch = true,
  showFilters = true,
  compactFilters = false,
  panelFilters = false,
}: AnimalFilterHeaderProps) {
  const { isEnglish } = useLanguage();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [sidoList, setSidoList] = useState<SidoItem[]>([]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, searchQuery: e.target.value };
    onFilterChange(newFilters);
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
    const bgnde = formatDateToYYYYMMDD(startDate);
    const endde = formatDateToYYYYMMDD(endDate);
    onFilterChange({ ...filters, bgnde, endde });
    setDateRangeOpen(false);
  }, [filters, startDate, endDate, onFilterChange]);

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

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className={`flex flex-col gap-2 ${compactFilters ? 'py-0' : 'py-2'}`}>
          {showSearch && <div className={searchBarWrapClass}>
            <Image
              src="/static/images/search-kk-mark.png"
              alt=""
              width={42}
              height={28}
              className="h-7 w-[42px] shrink-0 self-center object-contain"
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder={isEnglish ? 'Search breed, color, or shelter' : '품종, 색, 보호소명으로 검색해보세요'}
              className={searchInputClass}
            />
            <ImageSearchButton onSearch={onImageSearch} />
          </div>}

          {showSearch && quickFilters}

          {showFilters && <div className={panelFilters ? 'grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:[&>[data-filter-dropdown-root]]:!w-full' : compactFilters ? 'flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto' : filterRowClass}>
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
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={filters.upKindCd === option.value}
                      className={filterDropdownOptionStateClass(filters.upKindCd === option.value)}
                      onClick={() => handleFilterChange('upKindCd', option.value)}
                    >
                      {isEnglish ? option.englishLabel : option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                    <li
                      key={option.value || 'all'}
                      className={filterDropdownOptionStateClass(filters.sexCd === option.value)}
                      onClick={() => handleFilterChange('sexCd', option.value)}
                    >
                      {isEnglish ? ({ F: 'Female', M: 'Male', Q: 'Unknown' } as Record<string, string>)[option.value ?? ''] || 'All' : option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                    <li
                      role="option"
                      aria-selected={!filters.upr_cd && !filters.orgNm}
                      className={filterDropdownOptionStateClass(!filters.upr_cd && !filters.orgNm)}
                      onClick={() => handleRegionFilterChange(null)}
                    >
                      {isEnglish ? 'All Korea' : '전국'}
                    </li>
                    {sidoList.map((sido) => (
                      <li
                        key={sido.SIDO_CD}
                        role="option"
                        aria-selected={filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD}
                        className={filterDropdownOptionStateClass(filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD)}
                        onClick={() => handleRegionFilterChange(sido)}
                      >
                        {getSidoDisplayName(sido.SIDO_NAME, isEnglish)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
                <div className="absolute right-0 top-full z-[100] mt-1 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gray-200/95 bg-white p-4 shadow-xl outline-none">
                  <p className={datePopoverLabelClass}>{isEnglish ? 'Start date' : '시작일'}</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className={datePopoverInputClass}
                  />
                  <p className={datePopoverLabelEndClass}>{isEnglish ? 'End date' : '종료일'}</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className={datePopoverInputClass}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={clearDateRangeInPopover}
                      className="rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {isEnglish ? 'Clear' : '기간 지우기'}
                    </button>
                    <button
                      type="button"
                      onClick={commitDateRange}
                      className="rounded-full bg-primary1 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                    >
                      {isEnglish ? 'Apply' : '적용'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 필터 초기화 */}
            {(filters.sexCd !== null || filters.state !== null || (filters.upKindCd !== null && filters.upKindCd !== '417000') || filters.neuterYn !== null || filters.quickFilter !== null || filters.searchQuery || filters.bgnde || filters.endde || filters.upr_cd || filters.orgNm) && (
              <button
                type="button"
                onClick={() => {
                  const resetFilters = { sexCd: null, state: null, upKindCd: '417000', neuterYn: null, quickFilter: null, searchQuery: '', bgnde: null, endde: null, upr_cd: null, orgNm: null };
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
            )}
          </div>}
        </div>
      </div>
    </div>
  );
}
