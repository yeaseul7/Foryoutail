import type { ShelterInfoItem } from '@/packages/type/shelterTyps';

export interface ShelterInfoQueryParams {
  care_reg_no?: string;
  upr_cd?: string;
  org_cd?: string;
  pageNo?: string | number;
  numOfRows?: string | number;
}

interface ShelterInfoApiResponse {
  response?: {
    body?: {
      items?: {
        item?: ShelterInfoItem[] | ShelterInfoItem;
      };
    };
  };
}

function toQueryString(params: ShelterInfoQueryParams): string {
  const qp = new URLSearchParams();
  if (params.care_reg_no) qp.set('care_reg_no', params.care_reg_no);
  if (params.upr_cd) qp.set('upr_cd', params.upr_cd);
  if (params.org_cd) qp.set('org_cd', params.org_cd);
  if (params.pageNo != null) qp.set('pageNo', String(params.pageNo));
  if (params.numOfRows != null) qp.set('numOfRows', String(params.numOfRows));
  return qp.toString();
}

function buildApiUrl(params: ShelterInfoQueryParams, baseUrl?: string): string {
  const query = toQueryString(params);
  const path = `/api/shelter-info${query ? `?${query}` : ''}`;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export async function fetchShelterInfoItems(
  params: ShelterInfoQueryParams,
  options?: { baseUrl?: string; cache?: RequestCache },
): Promise<ShelterInfoItem[]> {
  const url = buildApiUrl(params, options?.baseUrl);
  const res = await fetch(url, {
    cache: options?.cache ?? 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`보호소 정보 조회 실패: ${res.status}`);
  }
  const data = (await res.json()) as ShelterInfoApiResponse;
  const raw = data?.response?.body?.items?.item;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export async function fetchShelterInfoByCareRegNo(
  careRegNo: string,
  options?: { baseUrl?: string; cache?: RequestCache },
): Promise<ShelterInfoItem | null> {
  const items = await fetchShelterInfoItems(
    { care_reg_no: careRegNo, pageNo: 1, numOfRows: 1 },
    options,
  );
  return items[0] ?? null;
}
