import type { ShelterAnimalItem } from '@/packages/type/shelterAnimalTypes';

interface ShelterDataApiResponse {
  response?: {
    body?: {
      items?: {
        item?: ShelterAnimalItem[] | ShelterAnimalItem | null;
      };
    };
  };
}

export interface ShelterDataQueryParams {
  desertion_no?: string;
  care_reg_no?: string;
  pageNo?: string | number;
  numOfRows?: string | number;
}

function toQueryString(params: ShelterDataQueryParams): string {
  const qp = new URLSearchParams();
  if (params.desertion_no) qp.set('desertion_no', params.desertion_no);
  if (params.care_reg_no) qp.set('care_reg_no', params.care_reg_no);
  if (params.pageNo != null) qp.set('pageNo', String(params.pageNo));
  if (params.numOfRows != null) qp.set('numOfRows', String(params.numOfRows));
  return qp.toString();
}

export async function fetchShelterAnimals(
  params: ShelterDataQueryParams,
): Promise<ShelterAnimalItem[]> {
  const query = toQueryString(params);
  const res = await fetch(`/api/shelter-data${query ? `?${query}` : ''}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`동물 정보 조회 실패: ${res.status}`);
  }

  const data = (await res.json()) as ShelterDataApiResponse;
  const raw = data.response?.body?.items?.item;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export async function fetchShelterAnimalByDesertionNo(
  desertionNo: string,
): Promise<ShelterAnimalItem | null> {
  const items = await fetchShelterAnimals({
    desertion_no: desertionNo,
    pageNo: 1,
    numOfRows: 1,
  });
  return items[0] ?? null;
}
