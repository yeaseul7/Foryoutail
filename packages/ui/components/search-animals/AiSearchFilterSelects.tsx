'use client';

import { useState, useEffect } from 'react';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import { sidoLocation } from '@/static/data/sidoLocation';
import type { AiSearchFiltersValues, PetTypeFilter } from './AiSearchFilters';

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

export interface AiSearchFilterSelectsProps {
  value: AiSearchFiltersValues;
  onChange: (value: AiSearchFiltersValues) => void;
  sidoList?: SidoItem[];
}

const PET_OPTIONS: { value: PetTypeFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: '417000', label: '강아지' },
  { value: '422400', label: '고양이' },
];

const SELECT_CLASS =
  'w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-800 focus:border-primary1 focus:outline-none focus:ring-1 focus:ring-primary1 appearance-none cursor-pointer';

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

  const handlePetTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, petType: (e.target.value || '') as PetTypeFilter });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 지역: select */}
      <div className="flex flex-col gap-1">
        <label htmlFor="ai-filter-region" className="text-sm font-medium text-gray-700">
          지역
        </label>
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

      {/* 동물: 드롭다운 select (스크롤 가능) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="ai-filter-pet" className="text-sm font-medium text-gray-700">
          동물
        </label>
        <div className="relative">
          <select
            id="ai-filter-pet"
            value={value.petType}
            onChange={handlePetTypeChange}
            className={SELECT_CLASS}
            aria-label="동물 종류 선택"
          >
            {PET_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
