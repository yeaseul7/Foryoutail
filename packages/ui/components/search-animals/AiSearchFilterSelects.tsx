'use client';

import { useState, useEffect } from 'react';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import { sidoLocation } from '@/static/data/sidoLocation';
import type { AiSearchFiltersValues } from './AiSearchFilters';
import { MdSearch } from 'react-icons/md';

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

export interface AiSearchFilterSelectsProps {
  value: AiSearchFiltersValues;
  onChange: (value: AiSearchFiltersValues) => void;
  sidoList?: SidoItem[];
}

const SELECT_CLASS =
  'w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-800 focus:border-primary1 focus:outline-none focus:ring-1 focus:ring-primary1 appearance-none cursor-pointer';

const PET_BUTTONS: { value: AiSearchFiltersValues['petType']; label: string }[] = [
  { value: '', label: '전체' },
  { value: '417000', label: '강아지' },
  { value: '422400', label: '고양이' },
];

export default function AiSearchFilterSelects({
  value,
  onChange,
  sidoList: sidoListProp,
}: AiSearchFilterSelectsProps) {
  const [loadedSidoList, setLoadedSidoList] = useState<SidoItem[]>([]);

  useEffect(() => {
    if (sidoListProp?.length) return;
    let list: SidoItem[] = [];
    const stored = localStorage.getItem('sido_data');
    if (stored) {
      try {
        const parsed: SidoItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {
        // fallback
      }
    }
    if (list.length === 0) list = sidoLocation.items ?? [];
    const toSet = list;
    queueMicrotask(() => setLoadedSidoList(toSet));
  }, [sidoListProp]);

  const sidoList = sidoListProp?.length ? sidoListProp : loadedSidoList;

  const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('handleSidoChange', e.target.value);
    const v = e.target.value;
    onChange({ ...value, sidoCd: v === '' ? null : v });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700">
        <MdSearch className="h-4 w-4 text-primary1" aria-hidden />
        <span>검색 조건</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          {PET_BUTTONS.map((opt) => {
            const isActive = value.petType === opt.value;
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => onChange({ ...value, petType: opt.value })}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${isActive
                    ? 'border-primary1 bg-primary1/10 text-primary1'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary1/40 hover:text-primary1'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* 지역: select */}
      <div className="w-full sm:w-[220px]">
        <div className="relative">
          <select
            id="ai-filter-region"
            value={value.sidoCd ?? ''}
            onChange={handleSidoChange}
            className={SELECT_CLASS}
            aria-label="지역 선택"
          >
            <option value="">전국</option>
            {sidoList.map((sido) => (
              <option key={sido.SIDO_CD} value={sido.SIDO_CD}>
                {getShortSidoName(sido.SIDO_NAME)}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            ▼
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
