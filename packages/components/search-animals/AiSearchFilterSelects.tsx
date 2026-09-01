'use client';

import { useEffect, useState } from 'react';
import { getShortSidoName } from '@/packages/utils/locationUtils';
import { sidoLocation } from '@/static/data/sidoLocation';
import type { AiSearchFiltersValues } from './AiSearchFilters';
import { useLanguage } from '@/lib/i18n/language';

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

export interface AiSearchFilterSelectsProps {
  value: AiSearchFiltersValues;
  onChange: (value: AiSearchFiltersValues) => void;
  sidoList?: SidoItem[];
}

export default function AiSearchFilterSelects({
  value,
  onChange,
  sidoList: sidoListProp,
}: AiSearchFilterSelectsProps) {
  const { isEnglish } = useLanguage();
  const [loadedSidoList, setLoadedSidoList] = useState<SidoItem[]>([]);
  const petButtons: { value: AiSearchFiltersValues['petType']; label: string }[] = [
    { value: '', label: isEnglish ? 'All' : '전체' },
    { value: '417000', label: isEnglish ? 'Dogs' : '강아지' },
    { value: '422400', label: isEnglish ? 'Cats' : '고양이' },
  ];

  useEffect(() => {
    if (sidoListProp?.length) return;
    queueMicrotask(() => setLoadedSidoList(sidoLocation.items ?? []));
  }, [sidoListProp]);

  const sidoList = sidoListProp?.length ? sidoListProp : loadedSidoList;

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label={isEnglish ? 'Animal type' : '동물 종류'}>
        {petButtons.map((option) => {
          const isActive = value.petType === option.value;
          return (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => onChange({ ...value, petType: option.value })}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                isActive
                  ? 'bg-[#4f8ed8] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <select
          value={value.sidoCd ?? ''}
          onChange={(event) =>
            onChange({ ...value, sidoCd: event.target.value || null })
          }
          className="appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#4f8ed8]"
          aria-label={isEnglish ? 'Search region' : '검색 지역'}
        >
          <option value="">{isEnglish ? 'All Korea' : '전국'}</option>
          {sidoList.map((sido) => (
            <option key={sido.SIDO_CD} value={sido.SIDO_CD}>
              {getShortSidoName(sido.SIDO_NAME)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" aria-hidden>
          ▼
        </span>
      </div>
    </div>
  );
}
