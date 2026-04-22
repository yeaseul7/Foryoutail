import {
  listFirestoreCollection,
  runFirestoreCollectionQuery,
  type FirestoreRestRow,
} from '@/lib/server/firestore-rest';
import type { ShelterAnimalItem } from '@/packages/type/shelterAnimalTypes';

/** `/api/shelter-data` 쿼리와 동일한 필터 키 (공공 API 파라미터 이름 유지) */
export interface ShelterDataFirestoreParams {
  bgnde?: string;
  endde?: string;
  upkind?: string;
  kind?: string;
  upr_cd?: string;
  org_cd?: string;
  care_reg_no?: string;
  state?: string;
  neuter_yn?: string;
  pageNo?: string;
  numOfRows?: string;
  _type?: string;
  bgupd?: string;
  enupd?: string;
  sex_cd?: string;
  rfid_cd?: string;
  desertion_no?: string;
  notice_no?: string;
  searchQuery?: string;
  orgNm?: string;
}

function stripFirestoreOnlyFields(data: Record<string, unknown>): ShelterAnimalItem {
  const rest = { ...data };
  delete rest.updatedAt;
  delete rest.createdAt;
  return rest as ShelterAnimalItem;
}

function firestoreRowToShelterAnimal(row: FirestoreRestRow): ShelterAnimalItem {
  const raw = row.data;
  const item = stripFirestoreOnlyFields(raw);
  const fromId = row.id.split('-');
  const desertionFromId = fromId[0]?.trim();
  const careFromId = fromId.length > 1 ? fromId.slice(1).join('-') : undefined;
  return {
    ...item,
    desertionNo: (item.desertionNo as string | undefined)?.trim() || desertionFromId,
    careRegNo: item.careRegNo?.trim() || careFromId,
  };
}

function itemYyyymmdd(item: ShelterAnimalItem): string {
  const raw = item.happenDt || item.noticeSdt || '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(0, 8);
}

function itemUpdYyyymmdd(item: ShelterAnimalItem): string {
  const raw = item.updTm || '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(0, 8);
}

function matchesDateRange(
  item: ShelterAnimalItem,
  bgnde?: string,
  endde?: string,
): boolean {
  if (!bgnde && !endde) return true;
  const key = itemYyyymmdd(item);
  if (key.length < 8) return true;
  if (bgnde && key < bgnde) return false;
  if (endde && key > endde) return false;
  return true;
}

function matchesUpdDateRange(
  item: ShelterAnimalItem,
  bgupd?: string,
  enupd?: string,
): boolean {
  if (!bgupd && !enupd) return true;
  const key = itemUpdYyyymmdd(item);
  if (key.length < 8) return true;
  if (bgupd && key < bgupd) return false;
  if (enupd && key > enupd) return false;
  return true;
}

function matchesState(item: ShelterAnimalItem, state?: string): boolean {
  if (!state) return true;
  const ps = (item.processState || '').trim();
  if (state === 'notice') return ps === 'notice' || ps === '공고중';
  if (state === 'protect') return ps === 'protect' || ps === '보호중';
  return ps === state;
}

function isListableState(item: ShelterAnimalItem): boolean {
  return matchesState(item, 'notice') || matchesState(item, 'protect');
}

function pickStringField(item: ShelterAnimalItem, camel: string, snake: string): string {
  const o = item as Record<string, unknown>;
  const a = o[camel];
  const b = o[snake];
  const v = (typeof a === 'string' ? a : typeof b === 'string' ? b : '') || '';
  return v.trim();
}

function matchesUprCd(item: ShelterAnimalItem, upr_cd?: string): boolean {
  if (!upr_cd) return true;
  const v = pickStringField(item, 'uprCd', 'upr_cd');
  if (!v) return false;
  return v === upr_cd.trim();
}

function matchesOrgCd(item: ShelterAnimalItem, org_cd?: string): boolean {
  if (!org_cd) return true;
  const v = pickStringField(item, 'orgCd', 'org_cd');
  return v === org_cd;
}

function matchesOrgNm(item: ShelterAnimalItem, orgNm?: string): boolean {
  const target = orgNm?.trim();
  if (!target) return true;
  const source = (item.orgNm || '').trim();
  if (!source) return false;
  return source.startsWith(target);
}

function matchesSearchQuery(item: ShelterAnimalItem, q: string): boolean {
  const searchLower = q.toLowerCase();
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
}

function sortShelterItemsByRecencyDesc(a: ShelterAnimalItem, b: ShelterAnimalItem): number {
  const toNum = (it: ShelterAnimalItem) =>
    parseInt(String(it.noticeSdt || it.happenDt || '0').replace(/\D/g, ''), 10) || 0;
  return toNum(b) - toNum(a);
}

export function filterShelterAnimalsFromParams(
  items: ShelterAnimalItem[],
  params: ShelterDataFirestoreParams,
): ShelterAnimalItem[] {
  return items.filter((item) => {
    if (params.desertion_no) {
      const id = (item.desertionNo || '').trim();
      if (id !== params.desertion_no.trim()) return false;
    }
    if (params.notice_no) {
      if ((item.noticeNo || '').trim() !== params.notice_no.trim()) return false;
    }
    if (params.care_reg_no) {
      if ((item.careRegNo || '').trim() !== params.care_reg_no.trim()) return false;
    }
    if (params.sex_cd) {
      if ((item.sexCd || '').trim() !== params.sex_cd.trim()) return false;
    }
    if (params.state && !matchesState(item, params.state)) return false;
    if (params.upkind) {
      if ((item.upKindCd || '').trim() !== params.upkind.trim()) return false;
    }
    if (params.kind) {
      if ((item.kindCd || '').trim() !== params.kind.trim()) return false;
    }
    if (params.neuter_yn) {
      if ((item.neuterYn || '').trim() !== params.neuter_yn.trim()) return false;
    }
    if (params.rfid_cd) {
      if (!(item.rfidCd || '').toLowerCase().includes(params.rfid_cd.toLowerCase())) {
        return false;
      }
    }
    if (!matchesDateRange(item, params.bgnde, params.endde)) return false;
    if (!matchesUpdDateRange(item, params.bgupd, params.enupd)) return false;
    if (!matchesUprCd(item, params.upr_cd)) return false;
    if (!matchesOrgCd(item, params.org_cd)) return false;
    if (!matchesOrgNm(item, params.orgNm)) return false;
    if (params.searchQuery && !matchesSearchQuery(item, params.searchQuery)) return false;
    return true;
  });
}

export async function loadAllShelterAnimalsFromFirestore(): Promise<ShelterAnimalItem[]> {
  const rows = await listFirestoreCollection('shelterAnimals');
  return rows.map(firestoreRowToShelterAnimal).sort(sortShelterItemsByRecencyDesc);
}

function stateQueryValues(state?: string): string[] | null {
  if (!state) return ['notice', 'protect', '공고중', '보호중'];
  if (state === 'notice') return ['notice', '공고중'];
  if (state === 'protect') return ['protect', '보호중'];
  return [state];
}

function buildShelterAnimalQueryFilters(params: ShelterDataFirestoreParams) {
  const filters: Parameters<typeof runFirestoreCollectionQuery>[0]['filters'] = [];

  if (params.orgNm?.trim()) {
    const orgNm = params.orgNm.trim();
    return [
      { field: 'orgNm', op: 'GREATER_THAN_OR_EQUAL' as const, value: orgNm },
      { field: 'orgNm', op: 'LESS_THAN_OR_EQUAL' as const, value: `${orgNm}\uf8ff` },
    ];
  }

  const states = stateQueryValues(params.state);

  if (states && states.length === 1) {
    filters.push({ field: 'processState', op: 'EQUAL', value: states[0] });
  } else if (states && states.length > 1) {
    filters.push({ field: 'processState', op: 'IN', value: states });
  }
  if (params.upkind) filters.push({ field: 'upKindCd', op: 'EQUAL', value: params.upkind.trim() });
  if (params.kind) filters.push({ field: 'kindCd', op: 'EQUAL', value: params.kind.trim() });
  if (params.sex_cd) filters.push({ field: 'sexCd', op: 'EQUAL', value: params.sex_cd.trim() });
  if (params.neuter_yn) {
    filters.push({ field: 'neuterYn', op: 'EQUAL', value: params.neuter_yn.trim() });
  }
  if (params.care_reg_no) {
    filters.push({ field: 'careRegNo', op: 'EQUAL', value: params.care_reg_no.trim() });
  }
  if (params.upr_cd) filters.push({ field: 'uprCd', op: 'EQUAL', value: params.upr_cd.trim() });
  if (params.org_cd) filters.push({ field: 'orgCd', op: 'EQUAL', value: params.org_cd.trim() });
  if (params.notice_no) {
    filters.push({ field: 'noticeNo', op: 'EQUAL', value: params.notice_no.trim() });
  }
  if (params.desertion_no) {
    filters.push({ field: 'desertionNo', op: 'EQUAL', value: params.desertion_no.trim() });
  }
  return filters;
}

export async function queryShelterAnimalsFromFirestore(
  params: ShelterDataFirestoreParams,
): Promise<{
  items: ShelterAnimalItem[];
  pageNo: number;
  numOfRows: number;
  hasMore: boolean;
}> {
  const pageNo = pageNum(params.pageNo, 1);
  const numOfRows = rowsNum(params.numOfRows, 1000);
  const usesOrgPrefixQuery = Boolean(params.orgNm?.trim());
  const queryLimit = usesOrgPrefixQuery ? Math.min(numOfRows * 5 + 1, 1000) : numOfRows + 1;
  const offset = (pageNo - 1) * (usesOrgPrefixQuery ? Math.max(queryLimit - 1, numOfRows) : numOfRows);
  const rows = await runFirestoreCollectionQuery({
    collectionId: 'shelterAnimals',
    filters: buildShelterAnimalQueryFilters(params),
    limit: queryLimit,
    offset,
  });
  const queried = rows.map(firestoreRowToShelterAnimal).sort(sortShelterItemsByRecencyDesc);
  const filtered = filterShelterAnimalsFromParams(queried, params).filter((item) =>
    params.state ? true : isListableState(item),
  );
  return {
    items: filtered.slice(0, numOfRows),
    pageNo,
    numOfRows,
    hasMore: filtered.length > numOfRows || rows.length > numOfRows,
  };
}

/**
 * 문서 ID가 `{desertionNo}-{careRegNo}` 형태일 때 documentId 범위로 조회 (전체 스캔 회피).
 */
export async function getShelterAnimalByDesertionNo(
  desertionNo: string,
): Promise<ShelterAnimalItem | null> {
  const trimmed = desertionNo.trim();
  if (!trimmed) return null;

  const rows = (
    await runFirestoreCollectionQuery({
      collectionId: 'shelterAnimals',
      filters: [{ field: 'desertionNo', op: 'EQUAL', value: trimmed }],
      limit: 10,
    })
  ).map(firestoreRowToShelterAnimal);

  if (rows.length === 0) return null;
  const sorted = [...rows].sort(sortShelterItemsByRecencyDesc);
  return sorted[0] ?? null;
}

export function buildAbandonmentPublicV2Json(
  pageItems: ShelterAnimalItem[],
  pageNo: number,
  numOfRows: number,
  totalFiltered: number,
) {
  const item =
    pageItems.length === 0 ? null : pageItems.length === 1 ? pageItems[0] : pageItems;

  return {
    response: {
      header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
      body: {
        items: { item },
        numOfRows,
        pageNo,
        totalCount: totalFiltered,
      },
    },
  };
}

export function buildShelterDataJsonFromQueryResult(result: {
  items: ShelterAnimalItem[];
  pageNo: number;
  numOfRows: number;
  hasMore: boolean;
}): ReturnType<typeof buildAbandonmentPublicV2Json> {
  return buildAbandonmentPublicV2Json(
    result.items,
    result.pageNo,
    result.numOfRows,
    result.hasMore ? result.pageNo * result.numOfRows + 1 : (result.pageNo - 1) * result.numOfRows + result.items.length,
  );
}

const pageNum = (raw: string | undefined, fallback: number) => {
  const n = parseInt(raw || String(fallback), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const rowsNum = (raw: string | undefined, fallback: number) => {
  const n = parseInt(raw || String(fallback), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(1000, n);
};

/** 유기번호 단건(상세·OG 등) — `desertion_no` 외 조건은 동일 행에 대해 추가 필터 */
export async function buildShelterDataJsonForDesertionNo(
  params: ShelterDataFirestoreParams,
): Promise<ReturnType<typeof buildAbandonmentPublicV2Json>> {
  const numOfRows = rowsNum(params.numOfRows, 1000);
  const pageNo = pageNum(params.pageNo, 1);
  const dn = params.desertion_no?.trim();
  if (!dn) {
    return buildAbandonmentPublicV2Json([], pageNo, numOfRows, 0);
  }
  const one = await getShelterAnimalByDesertionNo(dn);
  const filtered = one
    ? filterShelterAnimalsFromParams([one], { ...params, desertion_no: undefined })
    : [];
  const item = filtered[0] ?? null;
  return buildAbandonmentPublicV2Json(item ? [item] : [], pageNo, numOfRows, item ? 1 : 0);
}

/** 전체 스냅샷을 받아 목록·페이지네이션·검색 필터 적용 (라우트에서 캐시된 스냅샷을 넘김) */
export function buildShelterDataJsonFromAllItems(
  allSorted: ShelterAnimalItem[],
  params: ShelterDataFirestoreParams,
): ReturnType<typeof buildAbandonmentPublicV2Json> {
  const pageNo = pageNum(params.pageNo, 1);
  const numOfRows = rowsNum(params.numOfRows, 1000);
  const filtered = filterShelterAnimalsFromParams(allSorted, params);
  const start = (pageNo - 1) * numOfRows;
  const pageSlice = filtered.slice(start, start + numOfRows);
  return buildAbandonmentPublicV2Json(pageSlice, pageNo, numOfRows, filtered.length);
}
