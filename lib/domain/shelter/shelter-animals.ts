import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import type {
  ShelterAnimalItem,
  ShelterAnimalRow,
} from '@/packages/type/shelterAnimalTypes';

/** `/api/shelter-data` 쿼리와 동일한 필터 키 (공공 API 파라미터 이름 유지) */
export interface ShelterDataQueryParams {
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
  desertion_nos?: string;
  notice_no?: string;
  searchQuery?: string;
  orgNm?: string;
  listQuick?: 'noticeEnding';
  sort?: 'notice' | 'rescue';
}

const UP_KIND_CODE_TO_NAME: Record<string, string[]> = {
  '417000': ['개', '강아지', 'dog'],
  '422400': ['고양이', '묘', 'cat'],
  '429900': ['기타축종', '기타', 'other'],
};

function normalizeUpKindCode(upKindNm: string | null | undefined): string | undefined {
  const raw = (upKindNm || '').trim().toLowerCase();
  if (!raw) return undefined;

  const hit = Object.entries(UP_KIND_CODE_TO_NAME).find(([, names]) =>
    names.some((name) => raw.includes(name.toLowerCase())),
  );
  return hit?.[0];
}

export function supabaseRowToShelterAnimal(row: ShelterAnimalRow): ShelterAnimalItem {
  const popfiles = Array.isArray(row.popfiles)
    ? row.popfiles.filter((file): file is string => typeof file === 'string' && file.trim() !== '')
    : [];

  return {
    id: row.id,
    desertionNo: row.desertion_no?.trim(),
    careRegNo: row.care_reg_no?.trim() || undefined,
    noticeNo: row.notice_no?.trim() || undefined,
    noticeSdt: row.notice_sdt?.trim() || undefined,
    noticeEdt: row.notice_edt?.trim() || undefined,
    happenDt: row.happen_dt?.trim() || undefined,
    happenPlace: row.happen_place?.trim() || undefined,
    processState: row.process_state?.trim() || undefined,
    kindCd: row.kind_cd?.trim() || undefined,
    kindNm: row.kind_nm?.trim() || undefined,
    kindFullNm: row.kind_full_nm?.trim() || undefined,
    upKindNm: row.up_kind_nm?.trim() || undefined,
    upKindCd: row.up_kind_cd?.trim() || normalizeUpKindCode(row.up_kind_nm),
    colorCd: row.color_cd?.trim() || undefined,
    age: row.age?.trim() || undefined,
    weight: row.weight?.trim() || undefined,
    birthYear: row.birth_year ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    sexCd: row.sex_cd?.trim() || undefined,
    neuterYn: row.neuter_yn?.trim() || undefined,
    specialMark: row.special_mark?.trim() || undefined,
    rfidCd: row.rfid_cd?.trim() || undefined,
    updTm: row.upd_tm?.trim() || undefined,
    endReason: row.end_reason?.trim() || undefined,
    careNm: row.care_nm?.trim() || undefined,
    careTel: row.care_tel?.trim() || undefined,
    careAddr: row.care_addr?.trim() || undefined,
    orgNm: row.org_nm?.trim() || undefined,
    careOwnerNm: row.care_owner_nm?.trim() || undefined,
    sfeSoci: row.sfe_soci?.trim() || undefined,
    sfeHealth: row.sfe_health?.trim() || undefined,
    etcBigo: row.etc_bigo?.trim() || undefined,
    vaccinationChk: row.vaccination_chk?.trim() || undefined,
    healthChk: row.health_chk?.trim() || undefined,
    adptnTitle: row.adptn_title?.trim() || undefined,
    adptnSDate: row.adptn_s_date?.trim() || undefined,
    adptnEDate: row.adptn_e_date?.trim() || undefined,
    adptnConditionLimitTxt:
      row.adptn_condition_limit_txt?.trim() || undefined,
    adptnTxt: row.adptn_txt?.trim() || undefined,
    adptnImg: row.adptn_img?.trim() || undefined,
    sprtTitle: row.sprt_title?.trim() || undefined,
    sprtSDate: row.sprt_s_date?.trim() || undefined,
    sprtEDate: row.sprt_e_date?.trim() || undefined,
    sprtConditionLimitTxt:
      row.sprt_condition_limit_txt?.trim() || undefined,
    sprtTxt: row.sprt_txt?.trim() || undefined,
    sprtImg: row.sprt_img?.trim() || undefined,
    srvcTitle: row.srvc_title?.trim() || undefined,
    srvcSDate: row.srvc_s_date?.trim() || undefined,
    srvcEDate: row.srvc_e_date?.trim() || undefined,
    srvcConditionLimitTxt:
      row.srvc_condition_limit_txt?.trim() || undefined,
    srvcTxt: row.srvc_txt?.trim() || undefined,
    srvcImg: row.srvc_img?.trim() || undefined,
    evntTitle: row.evnt_title?.trim() || undefined,
    evntSDate: row.evnt_s_date?.trim() || undefined,
    evntEDate: row.evnt_e_date?.trim() || undefined,
    evntConditionLimitTxt:
      row.evnt_condition_limit_txt?.trim() || undefined,
    evntTxt: row.evnt_txt?.trim() || undefined,
    evntImg: row.evnt_img?.trim() || undefined,
    popfile: popfiles[0] || undefined,
    popfile1: popfiles[0] || undefined,
    popfile2: popfiles[1] || undefined,
    popfile3: popfiles[2] || undefined,
    popfile4: popfiles[3] || undefined,
    popfile5: popfiles[4] || undefined,
    popfile6: popfiles[5] || undefined,
    popfile7: popfiles[6] || undefined,
    popfile8: popfiles[7] || undefined,
  };
}

function itemYyyymmdd(item: ShelterAnimalItem): string {
  const raw = item.happenDt || item.noticeSdt || '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(0, 8);
}

function itemUpdYyyymmdd(item: ShelterAnimalItem): string {
  void item;
  const raw = '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(0, 8);
}

function yyyymmddToIsoDate(value?: string): string | undefined {
  if (!value || !/^\d{8}$/.test(value)) return undefined;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function seoulIsoDateAfter(days: number): string {
  const seoulToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = seoulToday.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
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
  return ps === state;
}

function isListableState(item: ShelterAnimalItem): boolean {
  return matchesState(item, 'notice') || matchesState(item, 'protect');
}

function matchesSearchQuery(item: ShelterAnimalItem, q: string): boolean {
  const searchLower = q.toLowerCase();
  const rfidCd = item.rfidCd?.toLowerCase() || '';
  const happenPlace = item.happenPlace?.toLowerCase() || '';
  const careAddr = item.careAddr?.toLowerCase() || '';
  const careNm = item.careNm?.toLowerCase() || '';
  const kindNm = item.kindNm?.toLowerCase() || '';
  const kindFullNm = item.kindFullNm?.toLowerCase() || '';
  const specialMark = item.specialMark?.toLowerCase() || '';
  return (
    rfidCd.includes(searchLower) ||
    happenPlace.includes(searchLower) ||
    careAddr.includes(searchLower) ||
    careNm.includes(searchLower) ||
    kindNm.includes(searchLower) ||
    kindFullNm.includes(searchLower) ||
    specialMark.includes(searchLower)
  );
}

function sortShelterItemsByRecencyDesc(a: ShelterAnimalItem, b: ShelterAnimalItem): number {
  const toNum = (it: ShelterAnimalItem) =>
    parseInt(String(it.noticeSdt || '0').replace(/\D/g, ''), 10) || 0;
  return toNum(b) - toNum(a);
}

function sortShelterItemsByRescueDateDesc(a: ShelterAnimalItem, b: ShelterAnimalItem): number {
  const toNum = (item: ShelterAnimalItem) =>
    parseInt(String(item.happenDt || '0').replace(/\D/g, ''), 10) || 0;
  return toNum(b) - toNum(a);
}

export function filterShelterAnimalsFromParams(
  items: ShelterAnimalItem[],
  params: ShelterDataQueryParams,
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
    if (params.neuter_yn) {
      if ((item.neuterYn || '').trim() !== params.neuter_yn.trim()) return false;
    }
    if (params.orgNm?.trim()) {
      const careAddr = (item.careAddr || '').trim();
      if (!careAddr.includes(params.orgNm.trim())) return false;
    }
    if (!matchesDateRange(item, params.bgnde, params.endde)) return false;
    if (!matchesUpdDateRange(item, params.bgupd, params.enupd)) return false;
    if (params.searchQuery && !matchesSearchQuery(item, params.searchQuery)) return false;
    return true;
  });
}

function stateQueryValues(state?: string): string[] | null {
  if (!state) return ['notice', 'protect'];
  return [state];
}

function upKindNamesFromCode(upkind?: string): string[] | null {
  if (!upkind) return null;
  return UP_KIND_CODE_TO_NAME[upkind.trim()] ?? null;
}

export async function loadAllShelterAnimals(): Promise<ShelterAnimalItem[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('animals')
    .select('*')
    .order('notice_start_date', { ascending: false, nullsFirst: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => supabaseRowToShelterAnimal(row as ShelterAnimalRow))
    .sort(sortShelterItemsByRecencyDesc);
}

export async function queryShelterAnimals(
  params: ShelterDataQueryParams,
): Promise<{
  items: ShelterAnimalItem[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  hasMore: boolean;
}> {
  const pageNo = pageNum(params.pageNo, 1);
  const numOfRows = rowsNum(params.numOfRows, 1000);
  const from = (pageNo - 1) * numOfRows;
  const to = from + numOfRows + 200;

  const supabaseAdmin = await createSupabaseAdminClient();
  let query = supabaseAdmin
    .from('animals')
    .select('*', { count: 'exact' });

  if (params.listQuick === 'noticeEnding') {
    query = query
      .gte('notice_end_date', seoulIsoDateAfter(0))
      .lte('notice_end_date', seoulIsoDateAfter(7))
      .order('notice_end_date', { ascending: true, nullsFirst: false })
      .order('notice_start_date', { ascending: false, nullsFirst: false });
  } else {
    query = params.sort === 'rescue'
      ? query.order('happened_date', { ascending: false, nullsFirst: false })
      : query.order('notice_start_date', { ascending: false, nullsFirst: false });
  }

  query = query.range(from, Math.min(to, from + 999));

  const beginDate = yyyymmddToIsoDate(params.bgnde);
  const endDate = yyyymmddToIsoDate(params.endde);
  if (beginDate) {
    query = query.gte('happened_date', beginDate);
  }
  if (endDate) {
    query = query.lte('happened_date', endDate);
  }

  const desertionNos = params.desertion_nos
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 50);
  if (desertionNos?.length) {
    query = query.in('desertion_no', desertionNos);
  } else if (params.desertion_no?.trim()) {
    query = query.eq('desertion_no', params.desertion_no.trim());
  }
  if (params.notice_no?.trim()) {
    query = query.eq('notice_no', params.notice_no.trim());
  }
  if (params.care_reg_no?.trim()) {
    query = query.eq('care_reg_no', params.care_reg_no.trim());
  }
  if (params.sex_cd?.trim()) {
    query = query.eq('sex_cd', params.sex_cd.trim());
  }
  if (params.neuter_yn?.trim()) {
    query = query.eq('neuter_yn', params.neuter_yn.trim());
  }
  if (params.orgNm?.trim()) {
    query = query.ilike('care_addr', `%${params.orgNm.trim()}%`);
  }

  const states = stateQueryValues(params.state);
  if (states && states.length > 0) {
    query = query.in('process_state', states);
  }

  const upKindNames = upKindNamesFromCode(params.upkind);
  if (upKindNames && upKindNames.length > 0) {
    query = query.in('up_kind_nm', upKindNames);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const queried = (data ?? []).map((row) =>
    supabaseRowToShelterAnimal(row as ShelterAnimalRow),
  );
  if (params.listQuick !== 'noticeEnding') {
    queried.sort(params.sort === 'rescue' ? sortShelterItemsByRescueDateDesc : sortShelterItemsByRecencyDesc);
  }

  const filtered = filterShelterAnimalsFromParams(queried, params).filter((item) =>
    params.state ? true : isListableState(item),
  );

  return {
    items: filtered.slice(0, numOfRows),
    pageNo,
    numOfRows,
    totalCount: count ?? 0,
    hasMore: pageNo * numOfRows < (count ?? 0),
  };
}

export async function getShelterAnimalByDesertionNo(
  desertionNo: string,
): Promise<ShelterAnimalItem | null> {
  const trimmed = desertionNo.trim();
  if (!trimmed) return null;

  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('animals')
    .select('*')
    .eq('desertion_no', trimmed)
    .order('notice_start_date', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? supabaseRowToShelterAnimal(data as ShelterAnimalRow) : null;
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
  totalCount: number;
  hasMore: boolean;
}): ReturnType<typeof buildAbandonmentPublicV2Json> {
  return buildAbandonmentPublicV2Json(
    result.items,
    result.pageNo,
    result.numOfRows,
    result.totalCount,
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

export async function buildShelterDataJsonForDesertionNo(
  params: ShelterDataQueryParams,
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

export function buildShelterDataJsonFromAllItems(
  allSorted: ShelterAnimalItem[],
  params: ShelterDataQueryParams,
): ReturnType<typeof buildAbandonmentPublicV2Json> {
  const pageNo = pageNum(params.pageNo, 1);
  const numOfRows = rowsNum(params.numOfRows, 1000);
  const filtered = filterShelterAnimalsFromParams(allSorted, params);
  const start = (pageNo - 1) * numOfRows;
  const pageSlice = filtered.slice(start, start + numOfRows);
  return buildAbandonmentPublicV2Json(pageSlice, pageNo, numOfRows, filtered.length);
}
