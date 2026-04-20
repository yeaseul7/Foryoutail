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

export type QuickFilterKey = 'likesHuman' | 'gentle' | 'nearby' | 'young';

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
  likesHuman: [
    '사람', '사람좋아', '사람을잘따름', '사람을잘따라',
    '사람을좋아', '사람친화', '사람친화적', '교감',
    '애교', '애교많', '애교쟁이',
    '붙임성', '붙임성좋', '잘따름',
    '사교성', '사교성좋',
    '사람만보면', '사람을보면좋아',
    '사람을잘따르고', '사람과잘지냄'
  ],
  gentle: [
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

/** 공공 API·프록시 한 번에 가져오는 행 수 (검색·특징 필터는 이후 클라이언트에서 적용) */
export const SHELTER_API_PAGE_SIZE = 100;

function parseShelterItemsFromResponse(shelterAnimalResponse: {
  response?: {
    header?: { resultCode?: string };
    body?: ShelterAnimalData['body'] & { items?: { item?: unknown } | string };
  };
}): ShelterAnimalItem[] {
  const resultCode = shelterAnimalResponse?.response?.header?.resultCode;
  if (resultCode && resultCode !== '00' && resultCode !== '0') {
    return [];
  }

  const rawItems = shelterAnimalResponse?.response?.body?.items;
  const itemData =
    rawItems != null && typeof rawItems === 'object' && !Array.isArray(rawItems)
      ? (rawItems as { item?: unknown }).item
      : undefined;

  if (itemData == null || itemData === '') {
    return [];
  }

  return Array.isArray(itemData)
    ? itemData.filter((x): x is ShelterAnimalItem => x != null && typeof x === 'object')
    : typeof itemData === 'object' && itemData !== null
      ? [itemData as ShelterAnimalItem]
      : [];
}

/** 검색어·specialMark quick만 클라이언트에서 거름 (API에는 구조 필터만 전달) */
export function applyShelterClientFilters(
  items: ShelterAnimalItem[],
  filters: AnimalFilterState,
): ShelterAnimalItem[] {
  let resultItems = items;
  const q = filters.searchQuery?.trim();
  if (q) {
    const searchLower = q.toLowerCase();
    resultItems = resultItems.filter((item) => {
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
  return applyQuickFilterBySpecialMark(resultItems, filters.quickFilter);
}

/** 구조 필터만 반영한 원시 목록 (항상 `SHELTER_API_PAGE_SIZE`건 단위 요청) */
async function fetchShelterAnimalDataFromApi(
  page: number,
  filters: AnimalFilterState,
): Promise<FetchShelterAnimalDataResult> {
  const params = new URLSearchParams();
  params.append('pageNo', page.toString());
  params.append('numOfRows', String(SHELTER_API_PAGE_SIZE));

  if (filters.sexCd) params.append('sex_cd', filters.sexCd);
  if (filters.state) params.append('state', filters.state);
  if (filters.upKindCd) params.append('upkind', filters.upKindCd);
  if (filters.neuterYn) params.append('neuter_yn', filters.neuterYn);
  if (filters.bgnde) params.append('bgnde', filters.bgnde);
  if (filters.endde) params.append('endde', filters.endde);
  if (filters.upr_cd) params.append('upr_cd', filters.upr_cd);

  const response = await fetch(`/api/shelter-data?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch shelter data');
  }

  const shelterAnimalResponse = (await response.json()) as Parameters<
    typeof parseShelterItemsFromResponse
  >[0];
  const itemsArray = parseShelterItemsFromResponse(shelterAnimalResponse);
  const hasMore = itemsArray.length === SHELTER_API_PAGE_SIZE;

  return { items: itemsArray, hasMore };
}

export async function fetchShelterAnimalData(
  page: number,
  filters: AnimalFilterState,
): Promise<FetchShelterAnimalDataResult> {
  const raw = await fetchShelterAnimalDataFromApi(page, filters);
  return {
    items: applyShelterClientFilters(raw.items, filters),
    hasMore: raw.hasMore,
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
