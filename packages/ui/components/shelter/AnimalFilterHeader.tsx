'use client';
import { useState, useMemo, useEffect } from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import Image from 'next/image';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import { RiResetLeftFill } from 'react-icons/ri';

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}


const sexOptions = [
  { value: null, label: '전체' },
  { value: 'F', label: '여자' },
  { value: 'M', label: '남자' },
  { value: 'Q', label: '미상' },
];

const stateOptions = [
  { value: null, label: '전체' },
  { value: 'notice', label: '공고중' },
  { value: 'protect', label: '보호중' },
];

const upKindOptions = [
  { value: null, label: '전체' },
  { value: '417000', label: '개' },
  { value: '422400', label: '고양이' },
  { value: '429900', label: '기타' },
];

export interface AnimalFilterState {
  sexCd: string | null;
  state: string | null;
  upKindCd: string | null;
  searchQuery: string;
  bgnde: string | null;
  endde: string | null;
  upr_cd: string | null;
}

interface AnimalFilterHeaderProps {
  filters: AnimalFilterState;
  onFilterChange: (filters: AnimalFilterState) => void;
}

export default function AnimalFilterHeader({ filters, onFilterChange }: AnimalFilterHeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sidoList, setSidoList] = useState<SidoItem[]>([]);

  useEffect(() => {
    console.log('filters', filters);
  }, [filters]);

  useEffect(() => {
    const loadSidoList = () => {
      const storedSidoData = localStorage.getItem('sido_data');
      if (storedSidoData) {
        try {
          const sidoData: SidoItem[] = JSON.parse(storedSidoData);
          setSidoList(sidoData);
        } catch (err) {
          console.error('시도 데이터 파싱 오류:', err);
        }
      }
    };
    loadSidoList();
  }, []);

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

  const handleStartDateBlur = () => {
    const formatted = formatDateToYYYYMMDD(startDate);
    const newFilters = { ...filters, bgnde: formatted };
    onFilterChange(newFilters);
  };

  const handleEndDateBlur = () => {
    const formatted = formatDateToYYYYMMDD(endDate);
    const newFilters = { ...filters, endde: formatted };
    onFilterChange(newFilters);
  };

  const getFilterLabel = (type: 'sexCd' | 'state' | 'upKindCd') => {
    const options = type === 'sexCd' ? sexOptions : type === 'state' ? stateOptions : upKindOptions;
    const selected = options.find((opt) => opt.value === filters[type]);
    return selected?.label || '전체';
  };

  return (
    <div className="w-full pb-3 pt-6 px-0 sm:pb-4 sm:pt-10 sm:px-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* 카드 컨테이너: 흰 배경, 둥근 모서리, 그림자 */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100/80 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          {/* 검색창 */}
          <div className="flex items-center w-full h-11 sm:h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 focus-within:border-primary1 focus-within:ring-2 focus-within:ring-primary1/20 transition-all">
            <Image
              src="/static/svg/icon-search-3.svg"
              alt="검색"
              width={20}
              height={20}
              className="mr-3 text-gray-400 shrink-0"
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="동물등록번호, 구조위치, 보호소명으로 검색해보세요"
              className="flex-1 min-w-0 text-sm placeholder-gray-400 text-gray-900 bg-transparent border-none outline-none"
            />
          </div>

          {/* 필터: 모바일 세로 배치 / 데스크톱 가로 배치 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {/* 성별 필터 */}
            <div className="relative z-50 w-full sm:w-auto">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'sexCd' ? null : 'sexCd')}
                className="flex w-full justify-between items-center px-4 py-2 min-w-0 sm:min-w-[88px] text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-full hover:border-gray-300 transition-colors"
              >
                <span>성별: {getFilterLabel('sexCd')}</span>
                <MdArrowDropDown className={`w-5 h-5 ml-1 shrink-0 transition-transform ${openDropdown === 'sexCd' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'sexCd' && (
                <ul className="absolute left-0 right-0 sm:right-auto top-full z-10 p-2 mt-1 min-w-[88px] sm:min-w-[88px] w-full sm:w-auto bg-white rounded-2xl shadow-lg border border-gray-100">
                  {sexOptions.map((option) => (
                    <li
                      key={option.value || 'all'}
                      className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${filters.sexCd === option.value ? 'bg-primary1 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => handleFilterChange('sexCd', option.value)}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 상태 필터 */}
            <div className="relative z-50 w-full sm:w-auto">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
                className="flex w-full justify-between items-center px-4 py-2 min-w-0 sm:min-w-[88px] text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-full hover:border-gray-300 transition-colors"
              >
                <span>상태: {getFilterLabel('state')}</span>
                <MdArrowDropDown className={`w-5 h-5 ml-1 shrink-0 transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'state' && (
                <ul className="absolute left-0 right-0 sm:right-auto top-full z-10 p-2 mt-1 min-w-[88px] w-full sm:w-auto bg-white rounded-2xl shadow-lg border border-gray-100">
                  {stateOptions.map((option) => (
                    <li
                      key={option.value || 'all'}
                      className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${filters.state === option.value ? 'bg-primary1 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => handleFilterChange('state', option.value)}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 축종 필터 */}
            <div className="relative z-50 w-full sm:w-auto">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'upKindCd' ? null : 'upKindCd')}
                className="flex w-full justify-between items-center px-4 py-2 min-w-0 sm:min-w-[88px] text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-full hover:border-gray-300 transition-colors"
              >
                <span>축종: {getFilterLabel('upKindCd')}</span>
                <MdArrowDropDown className={`w-5 h-5 ml-1 shrink-0 transition-transform ${openDropdown === 'upKindCd' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'upKindCd' && (
                <ul className="absolute left-0 right-0 sm:right-auto top-full z-10 p-2 mt-1 min-w-[88px] w-full sm:w-auto bg-white rounded-2xl shadow-lg border border-gray-100">
                  {upKindOptions.map((option) => (
                    <li
                      key={option.value || 'all'}
                      className={`px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${filters.upKindCd === option.value ? 'bg-primary1 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => handleFilterChange('upKindCd', option.value)}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 접수일: 한 블록 (모바일에서 날짜 영역 넘침 방지) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2 w-full sm:w-auto bg-gray-50 border border-gray-100 rounded-2xl sm:rounded-full text-sm text-gray-700">
              <span className="text-gray-500 shrink-0 font-medium">접수일:</span>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  onBlur={handleStartDateBlur}
                  className="min-w-0 flex-1 w-full max-w-[160px] text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary1/20 focus:border-primary1 [color-scheme:light]"
                />
                <span className="text-gray-400 shrink-0">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  onBlur={handleEndDateBlur}
                  className="min-w-0 flex-1 w-full max-w-[160px] text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary1/20 focus:border-primary1 [color-scheme:light]"
                />
              </div>
            </div>

            {/* 필터 초기화 */}
            {(filters.sexCd !== null || filters.state !== null || filters.upKindCd !== null || filters.searchQuery || filters.bgnde || filters.endde || filters.upr_cd) && (
              <button
                onClick={() => {
                  const resetFilters = { sexCd: null, state: null, upKindCd: null, searchQuery: '', bgnde: null, endde: null, upr_cd: null };
                  onFilterChange(resetFilters);
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-600 flex items-center justify-center gap-1.5 hover:bg-gray-300/80 rounded-full transition-colors"
              >
                <RiResetLeftFill className="w-4 h-4 shrink-0" />
                필터 초기화
              </button>
            )}
          </div>

          {/* 지역 버튼: 모바일에서만 표시, 4열 그리드 (데스크톱은 RegionMap에서 선택) */}
          {sidoList.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pt-1 lg:hidden">
              <button
                onClick={() => handleFilterChange('upr_cd', null)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${!filters.upr_cd ? 'bg-primary1 text-white border-primary1' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
              >
                전체
              </button>
              {sidoList.map((sido) => (
                <button
                  key={sido.SIDO_CD}
                  onClick={() => handleFilterChange('upr_cd', sido.SIDO_CD)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${filters.upr_cd === sido.SIDO_CD ? 'bg-primary1 text-white border-primary1' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                >
                  {getShortSidoName(sido.SIDO_NAME)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
