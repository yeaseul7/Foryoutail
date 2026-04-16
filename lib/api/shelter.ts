import { ShelterAnimalData, ShelterAnimalItem } from '@/packages/type/postType';

/** 공고/보호 중만 목록에 노출 (공공 API·Firestore에 따라 영문·한글 모두 허용) */
export function isShelterAnimalListable(processState: string | null | undefined): boolean {
  if (!processState || !String(processState).trim()) return false;
  const s = String(processState).trim();
  if (s === 'notice' || s === 'protect') return true;
  if (s === '공고중' || s === '보호중') return true;
  return false;
}

function sortShelterItemsByRecencyDesc(a: ShelterAnimalItem, b: ShelterAnimalItem): number {
  const toNum = (it: ShelterAnimalItem) =>
    parseInt(String(it.noticeSdt || it.happenDt || '0').replace(/\D/g, ''), 10) || 0;
  return toNum(b) - toNum(a);
}

function mergeShelterItemsByDesertionNo(
  first: ShelterAnimalItem[],
  second: ShelterAnimalItem[],
): ShelterAnimalItem[] {
  const map = new Map<string, ShelterAnimalItem>();
  const upsert = (item: ShelterAnimalItem) => {
    const id = item.desertionNo?.trim();
    if (!id) return;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, item);
      return;
    }
    map.set(id, sortShelterItemsByRecencyDesc(item, prev) < 0 ? prev : item);
  };
  for (const item of first) upsert(item);
  for (const item of second) upsert(item);
  return [...map.values()].sort(sortShelterItemsByRecencyDesc);
}

export type QuickFilterKey =
  | 'humanDog'
  | 'humanCat'
  | 'gentleCat'
  | 'nearby'
  | 'gentleDog'
  | 'young';

export interface AnimalFilterState {
  sexCd: string | null;
  state: string | null;
  upKindCd: string | null;
  neuterYn: string | null;
  quickFilter: QuickFilterKey | null;
  searchQuery: string;
  bgnde: string | null;
  endde: string | null;
  upr_cd: string | null; // 시도 코드
}

const QUICK_FILTER_KEYWORDS: Record<Exclude<QuickFilterKey, 'nearby'>, string[]> = {
  humanDog: [
    '사람', '사람좋아', '사람을잘따름', '사람을잘따라',
    '사람을좋아', '사람친화', '사람친화적', '교감',
    '애교', '애교많', '애교쟁이',
    '붙임성', '붙임성좋', '잘따름',
    '사교성', '사교성좋',
    '사람만보면', '사람을보면좋아',
    '사람을잘따르고', '사람과잘지냄'
  ],
  humanCat: [
    '사람', '사람좋아', '사람을잘따름', '사람을잘따라',
    '사람을좋아', '사람친화', '사람친화적', '교감',
    '애교', '애교많', '애교쟁이',
    '붙임성', '붙임성좋', '잘따름',
    '사교성', '사교성좋',
    '사람만보면', '사람을보면좋아',
    '사람을잘따르고', '사람과잘지냄'
  ],
  gentleDog: [
    '순한', '온순', '착함', '착한', '순둥', '순둥이',
    '온화', '차분', '얌전', '얌전한',
    '조용', '조용한',
    '성격좋', '성격이좋',
    '무난', '무난한',
    '공격성없', '공격성없음',
    '사납지않', '사납지않음',
    '겁이없', '겁이없음',
    '사람을잘따르고온순',
  ],
  gentleCat: [
    '순한', '온순', '착함', '착한', '순둥', '순둥이',
    '온화', '차분', '얌전', '얌전한',
    '조용', '조용한',
    '성격좋', '성격이좋',
    '무난', '무난한',
    '공격성없', '공격성없음',
    '사납지않', '사납지않음',
    '겁이없', '겁이없음',
    '사람을잘따르고온순',
  ],
  young: [
    '어린', '새끼', '아기', '유견', '유묘',
    '개월', '개월령',
    '2개월', '3개월', '4개월', '5개월', '6개월',
    '생후', '태어난지',
    '어린아이', '아직어림',
    '어린편', '나이가어림'
  ],
};

function normalizeKoreanText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '');
}

function applyQuickFilterBySpecialMark(
  items: ShelterAnimalItem[],
  quickFilter: QuickFilterKey | null,
): ShelterAnimalItem[] {
  if (!quickFilter || quickFilter === 'nearby') return items;
  const keywords = QUICK_FILTER_KEYWORDS[quickFilter];
  if (!keywords || keywords.length === 0) return items;

  return items.filter((item) => {
    const specialMark = normalizeKoreanText(item.specialMark ?? '');
    if (!specialMark) return false;
    return keywords.some((keyword) => specialMark.includes(normalizeKoreanText(keyword)));
  });
}

export interface FetchShelterAnimalDataResult {
  items: ShelterAnimalItem[];
  hasMore: boolean;
}

/** specialMark·검색어 필터 시 한 번에 가져올 최대 건수 (1000이면 공공 API·JSON 파싱이 너무 무거움) */
const CLIENT_FILTER_PAGE_SIZE = 300;

export async function fetchShelterAnimalData(
  page: number,
  filters: AnimalFilterState,
): Promise<FetchShelterAnimalDataResult> {
  // specialMark / 검색어는 클라이언트(또는 route에서 search만)에서 다시 거름 → 페이지당 CLIENT_FILTER_PAGE_SIZE씩만 요청하고, 부족하면 스크롤로 다음 pageNo
  const needsLargeClientBatch =
    Boolean(filters.searchQuery?.trim()) ||
    (Boolean(filters.quickFilter) && filters.quickFilter !== 'nearby');
  const numOfRows = needsLargeClientBatch ? CLIENT_FILTER_PAGE_SIZE : 30;

  const params = new URLSearchParams();
  params.append('pageNo', page.toString());
  params.append('numOfRows', numOfRows.toString());

  if (filters.sexCd) params.append('sex_cd', filters.sexCd);
  if (filters.state) params.append('state', filters.state);
  if (filters.upKindCd) params.append('upkind', filters.upKindCd);
  if (filters.neuterYn) params.append('neuter_yn', filters.neuterYn);
  if (filters.bgnde) params.append('bgnde', filters.bgnde);
  if (filters.endde) params.append('endde', filters.endde);
  if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
  if (filters.upr_cd) params.append('upr_cd', filters.upr_cd);

  const response = await fetch(`/api/shelter-data?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch shelter data');
  }

  const shelterAnimalResponse = (await response.json()) as {
    response?: {
      header?: { resultCode?: string };
      body?: ShelterAnimalData['body'] & { items?: { item?: unknown } | string };
    };
  };

  const resultCode = shelterAnimalResponse?.response?.header?.resultCode;
  if (resultCode && resultCode !== '00' && resultCode !== '0') {
    return { items: [], hasMore: false };
  }

  const rawItems = shelterAnimalResponse?.response?.body?.items;
  const itemData =
    rawItems != null && typeof rawItems === 'object' && !Array.isArray(rawItems)
      ? (rawItems as { item?: unknown }).item
      : undefined;

  if (itemData == null || itemData === '') {
    return { items: [], hasMore: false };
  }

  const itemsArray: ShelterAnimalItem[] = Array.isArray(itemData)
    ? itemData.filter((x): x is ShelterAnimalItem => x != null && typeof x === 'object')
    : typeof itemData === 'object' && itemData !== null
      ? [itemData as ShelterAnimalItem]
      : [];

  const originalItemsLength = itemsArray.length;

  let resultItems = itemsArray;

  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    resultItems = itemsArray.filter((item) => {
      const rfidCd = item.rfidCd?.toLowerCase() || '';
      const happenPlace = item.happenPlace?.toLowerCase() || '';
      const careAddr = item.careAddr?.toLowerCase() || '';
      const careNm = item.careNm?.toLowerCase() || '';
      return (
        rfidCd.includes(searchLower) ||
        happenPlace.includes(searchLower) ||
        careAddr.includes(searchLower) ||
        careNm.includes(searchLower)
      );
    });
  }

  resultItems = applyQuickFilterBySpecialMark(resultItems, filters.quickFilter);

  const hasMore = originalItemsLength === numOfRows;

  return {
    items: resultItems,
    hasMore,
  };
}

/**
 * 공고중(notice)·보호중(protect)만 합쳐서 조회 (공공 API는 state당 한 종류만 허용하는 경우가 많음).
 * `filters.state`는 무시되고 병합 결과만 반환합니다.
 */
export async function fetchShelterAnimalDataNoticeProtectMerged(
  page: number,
  filters: AnimalFilterState,
): Promise<FetchShelterAnimalDataResult> {
  const base: AnimalFilterState = { ...filters, state: null };
  const [noticeRes, protectRes] = await Promise.all([
    fetchShelterAnimalData(page, { ...base, state: 'notice' }),
    fetchShelterAnimalData(page, { ...base, state: 'protect' }),
  ]);
  const merged = mergeShelterItemsByDesertionNo(noticeRes.items, protectRes.items);
  const listable = merged.filter((it) => isShelterAnimalListable(it.processState));
  return {
    items: listable,
    hasMore: noticeRes.hasMore || protectRes.hasMore,
  };
}
