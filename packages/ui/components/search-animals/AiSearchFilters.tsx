'use client';

import { useState, useEffect } from 'react';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import { MdLocationOn, MdPets } from 'react-icons/md';
import { sidoLocation } from '@/static/data/sidoLocation';

export type PetTypeFilter = '' | '417000' | '422400'; // '' = 전체, 417000 = 개, 422400 = 고양이

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

export interface AiSearchFiltersValues {
  sidoCd: string | null;
  petType: PetTypeFilter;
}

export interface AiSearchFiltersProps {
  value: AiSearchFiltersValues;
  onChange: (value: AiSearchFiltersValues) => void;
  /** 시도 목록: localStorage sido_data 우선, 없으면 sidoLocation 사용 */
  sidoList?: SidoItem[];
}

const PET_OPTIONS: { value: PetTypeFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: '417000', label: '강아지' },
  { value: '422400', label: '고양이' },
];

export default function AiSearchFilters({
  value,
  onChange,
  sidoList: sidoListProp,
}: AiSearchFiltersProps) {
  const [sidoList, setSidoList] = useState<SidoItem[]>(sidoListProp ?? []);

  useEffect(() => {
    if (sidoListProp && sidoListProp.length > 0) {
      setSidoList(sidoListProp);
      return;
    }
    const stored = localStorage.getItem('sido_data');
    if (stored) {
      try {
        const parsed: SidoItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setSidoList(parsed);
        return;
      } catch {
        // fallback to static
      }
    }
    setSidoList(sidoLocation.items ?? []);
  }, [sidoListProp]);

  const handleSidoChange = (sidoCd: string) => {
    const next = value.sidoCd === sidoCd ? null : sidoCd;
    onChange({ ...value, sidoCd: next });
  };

  const handlePetTypeChange = (petType: PetTypeFilter) => {
    onChange({ ...value, petType });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 지역 필터 */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <MdLocationOn className="w-4 h-4 text-primary1" />
          지역
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, sidoCd: null })}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
              value.sidoCd === null
                ? 'bg-primary1 text-white border-primary1'
                : 'bg-white text-gray-600 border-gray-300 hover:border-primary1 hover:text-primary1'
            }`}
          >
            전국
          </button>
          {sidoList.map((sido) => {
            const isSelected = value.sidoCd === sido.SIDO_CD;
            return (
              <button
                key={sido.SIDO_CD}
                type="button"
                onClick={() => handleSidoChange(sido.SIDO_CD)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary1 text-white border-primary1'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary1 hover:text-primary1'
                }`}
              >
                {getShortSidoName(sido.SIDO_NAME)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 개/고양이 선택 */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <MdPets className="w-4 h-4 text-primary1" />
          동물
        </span>
        <div className="flex flex-wrap gap-2">
          {PET_OPTIONS.map((opt) => {
            const isSelected = value.petType === opt.value;
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => handlePetTypeChange(opt.value)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary1 text-white border-primary1'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary1 hover:text-primary1'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
