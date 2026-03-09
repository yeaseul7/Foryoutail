import { ShelterAnimalData, ShelterAnimalItem } from '@/packages/type/postType';

export interface AnimalFilterState {
  sexCd: string | null;
  state: string | null;
  upKindCd: string | null;
  searchQuery: string;
  bgnde: string | null;
  endde: string | null;
  upr_cd: string | null; // 시도 코드
}

export interface FetchShelterAnimalDataResult {
  items: ShelterAnimalItem[];
  hasMore: boolean;
}

export async function fetchShelterAnimalData(
  page: number,
  filters: AnimalFilterState,
): Promise<FetchShelterAnimalDataResult> {
  const params = new URLSearchParams();
  params.append('pageNo', page.toString());
  params.append('numOfRows', '30');

  if (filters.sexCd) params.append('sex_cd', filters.sexCd);
  if (filters.state) params.append('state', filters.state);
  if (filters.upKindCd) params.append('upkind', filters.upKindCd);
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

  const hasMore = originalItemsLength === 30;

  return {
    items: resultItems,
    hasMore,
  };
}
