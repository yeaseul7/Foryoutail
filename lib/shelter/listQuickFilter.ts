import {
  fetchShelterAnimalData,
  isShelterAnimalListable,
  type AnimalFilterState,
} from '@/lib/client/shelter';
import type { ShelterAnimalItem } from '@/packages/type/postType';

export type ListQuickFilterId = 'birthYear' | 'noticeEnding' | 'recentReg' | 'neutered';

function parseCompactYmd8(ymd: string): Date | null {
  if (!ymd || ymd.length < 8) return null;
  const y = parseInt(ymd.slice(0, 4), 10);
  const m = parseInt(ymd.slice(4, 6), 10) - 1;
  const d = parseInt(ymd.slice(6, 8), 10);
  const dt = new Date(y, m, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** 공고 종료일까지 남은 일수(당일=0). 파싱 실패 시 null */
export function daysUntilNoticeEnd(noticeEdt: string | undefined): number | null {
  if (!noticeEdt || noticeEdt.length < 8) return null;
  const end = parseCompactYmd8(noticeEdt);
  if (!end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function matchListQuickFilter(
  item: ShelterAnimalItem,
  mode: ListQuickFilterId,
  opts: { yearFull: number; recentWindowDays: number },
): boolean {
  if (!isShelterAnimalListable(item.processState)) return false;
  switch (mode) {
    case 'birthYear': {
      const age = item.age?.trim();
      if (!age) return false;
      return age.includes(String(opts.yearFull));
    }
    case 'noticeEnding': {
      const d = daysUntilNoticeEnd(item.noticeEdt);
      return d !== null && d >= 0 && d <= 7;
    }
    case 'recentReg': {
      const raw = item.happenDt;
      if (!raw || raw.length < 8) return false;
      const happen = parseCompactYmd8(raw.slice(0, 8));
      if (!happen) return false;
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - opts.recentWindowDays);
      happen.setHours(0, 0, 0, 0);
      return happen >= cutoff;
    }
    case 'neutered':
      return item.neuterYn === 'Y';
    default:
      return false;
  }
}

/**
 * 한 번의 API 호출(약 100건) 결과에서 리스트 빠른 필터에 맞는 항목만 골라 반환합니다.
 * 스크롤 시 `startPage`만 올려 같은 방식으로 이어 붙입니다. `seenIds`로 중복을 막습니다.
 */
export async function gatherListQuickMatches(
  baseFilters: AnimalFilterState,
  mode: ListQuickFilterId,
  startPage: number,
  seenIds: Set<string>,
  yearFull: number,
  recentWindowDays: number,
): Promise<{ picked: ShelterAnimalItem[]; nextPage: number; exhausted: boolean }> {
  const filters: AnimalFilterState = { ...baseFilters, quickFilter: null };
  const { items, hasMore } = await fetchShelterAnimalData(startPage, filters);
  const picked: ShelterAnimalItem[] = [];
  for (const it of items) {
    const id = it.desertionNo?.trim();
    if (!id || seenIds.has(id)) continue;
    if (!matchListQuickFilter(it, mode, { yearFull, recentWindowDays })) continue;
    seenIds.add(id);
    picked.push(it);
  }
  return { picked, nextPage: startPage + 1, exhausted: !hasMore };
}
