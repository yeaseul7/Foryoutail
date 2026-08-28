'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  MdArrowDropDown,
  MdCalendarToday,
  MdLocationOn,
  MdPeople,
} from 'react-icons/md';
import Image from 'next/image';
import { RiResetLeftFill } from 'react-icons/ri';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import type { QuickFilterKey } from '@/lib/client/shelter';
import { sidoLocation } from '@/static/data/sidoLocation';

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

/** AnimalFilterHeader 전용 — 검색(더 높게) / 필터 pill(더 낮게) */
const searchBarWrapClass =
  'flex min-w-0 flex-[1.4] items-center min-h-[42px] bg-white border border-slate-200 rounded-xl px-3 focus-within:border-[#4f8ed8] focus-within:ring-2 focus-within:ring-[#4f8ed8]/15 transition-shadow';
const searchInputClass =
  'flex-1 min-w-0 h-10 py-2 text-sm placeholder:text-slate-400 text-gray-900 bg-transparent border-none outline-none';

const filterRowClass =
  'flex min-w-0 flex-[2] flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-stretch';
const filterPillButtonClass =
  'flex w-full min-h-[42px] items-center justify-between gap-1.5 px-3 py-1 min-w-0 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-[#4f8ed8]/60 hover:bg-blue-50/30 transition-colors';
const filterPillLeadClass = 'flex items-center gap-1.5 min-w-0 sm:gap-2';
const filterPillIconClass = 'h-4 w-4 shrink-0 text-gray-600';
const filterChevronClass = 'h-4 w-4 shrink-0 transition-transform';
const filterDropdownRootClass = 'relative z-50 w-full min-w-0 sm:flex-1';
const filterDateFieldWrapClass = 'relative z-40 w-full min-w-0 sm:flex-[2_1_0%]';
const filterDropdownMenuBaseClass =
  'absolute left-0 right-0 sm:right-auto top-full z-10 mt-2 min-w-[88px] w-full sm:w-auto rounded-2xl border border-gray-200/90 bg-white py-1.5 px-1.5 shadow-xl';
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
  'w-full shrink-0 min-h-[42px] sm:w-auto sm:flex-none px-3 py-1 text-sm font-medium text-gray-700 border border-slate-200 bg-white flex items-center justify-center gap-1.5 hover:bg-gray-50 rounded-xl transition-colors';

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
}

export default function AnimalFilterHeader({ filters, onFilterChange }: AnimalFilterHeaderProps) {
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
    return selected?.label || '전체';
  };

  const getRegionFilterLabel = (): string => {
    if (filters.orgNm?.trim()) return getShortSidoName(filters.orgNm.trim());
    if (!filters.upr_cd) return '전국';
    const hit = sidoList.find((s) => s.SIDO_CD === filters.upr_cd);
    return hit ? getShortSidoName(hit.SIDO_NAME) : '전국';
  };

  const hasSidoList = sidoList.length > 0;

  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 rounded-xl border-2 border-[#7aa9cf] bg-white p-2 shadow-[0_5px_14px_rgba(70,125,170,0.12)] lg:flex-row">
          <div className={searchBarWrapClass}>
            <Image
              src="/static/svg/icon-search-3.svg"
              alt="검색"
              width={20}
              height={20}
              className="mr-3 text-gray-600 shrink-0"
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="품종, 색, 보호소명으로 검색해보세요"
              className={searchInputClass}
            />
          </div>

          <div className={filterRowClass}>
            {/* 성별 */}
            <div className={filterDropdownRootClass} data-filter-dropdown-root>
              <button
                type="button"
                onClick={() => {
                  setDateRangeOpen(false);
                  setOpenDropdown(openDropdown === 'sexCd' ? null : 'sexCd');
                }}
                className={filterPillButtonClass}
              >
                <span className={filterPillLeadClass}>
                  <MdPeople className={filterPillIconClass} aria-hidden />
                  <span className="truncate">성별 · {getSexFilterLabel()}</span>
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
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 지역 (시도) */}
            {hasSidoList && (
              <div className={filterDropdownRootClass} data-filter-dropdown-root>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={openDropdown === 'upr_cd'}
                  aria-label={`구조 지역 · ${getRegionFilterLabel()}`}
                  onClick={() => {
                    setDateRangeOpen(false);
                    setOpenDropdown(openDropdown === 'upr_cd' ? null : 'upr_cd');
                  }}
                  className={filterPillButtonClass}
                >
                  <span className={filterPillLeadClass}>
                    <MdLocationOn className={filterPillIconClass} aria-hidden />
                    <span className="truncate">구조 지역 · {getRegionFilterLabel()}</span>
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
                    aria-label="시도 목록"
                  >
                    <li
                      role="option"
                      aria-selected={!filters.upr_cd && !filters.orgNm}
                      className={filterDropdownOptionStateClass(!filters.upr_cd && !filters.orgNm)}
                      onClick={() => handleRegionFilterChange(null)}
                    >
                      전국
                    </li>
                    {sidoList.map((sido) => (
                      <li
                        key={sido.SIDO_CD}
                        role="option"
                        aria-selected={filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD}
                        className={filterDropdownOptionStateClass(filters.orgNm === sido.SIDO_NAME || filters.upr_cd === sido.SIDO_CD)}
                        onClick={() => handleRegionFilterChange(sido)}
                      >
                        {getShortSidoName(sido.SIDO_NAME)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 접수일: 한 컨트롤에서 from~to (팝오버) — 가로 2비율 */}
            <div className={filterDateFieldWrapClass} data-filter-dropdown-root>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(null);
                  setDateRangeOpen((open) => !open);
                }}
                className={filterPillButtonClass}
              >
                <span className={filterPillLeadClass}>
                  <MdCalendarToday className={filterPillIconClass} aria-hidden />
                  <span className="truncate text-left">
                    접수일 · {getDateRangeSummaryLabel(startDate, endDate)}
                  </span>
                </span>
                <MdArrowDropDown
                  className={`${filterChevronClass} ${dateRangeOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {dateRangeOpen && (
                <div className="absolute left-0 top-full z-[100] mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gray-200/95 bg-white p-4 shadow-xl outline-none">
                  <p className={datePopoverLabelClass}>시작일</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className={datePopoverInputClass}
                  />
                  <p className={datePopoverLabelEndClass}>종료일</p>
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
                      기간 지우기
                    </button>
                    <button
                      type="button"
                      onClick={commitDateRange}
                      className="rounded-full bg-primary1 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                    >
                      적용
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
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
