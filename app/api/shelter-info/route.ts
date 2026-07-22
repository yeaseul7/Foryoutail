import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { sidoLocation } from '@/static/data/sidoLocation';

interface ShelterInfoParams {
  id?: string;
  care_reg_no?: string;
  upr_cd?: string;
  org_cd?: string;
  pageNo?: number;
  numOfRows?: number;
}

interface ShelterRow {
  id: string;
  care_reg_no: string;
  care_nm: string;
  care_addr: string | null;
  jibun_addr: string | null;
  lat: number | null;
  lng: number | null;
  care_tel: string | null;
  close_day: string | null;
  week_opr_stime: string | null;
  week_opr_etime: string | null;
  weekend_opr_stime: string | null;
  weekend_opr_etime: string | null;
  breed_cnt: number | null;
  vet_person_cnt: number | null;
  specs_person_cnt: number | null;
  medical_cnt: number | null;
  save_trgt_animal: string | null;
  division_nm: string | null;
  org_nm: string | null;
  shelter_migrated_data: Record<string, unknown> | null;
}

function pickNestedString(
  raw: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!raw) return undefined;
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

function pickNestedNumber(
  raw: Record<string, unknown> | null | undefined,
  ...keys: string[]
): number | undefined {
  if (!raw) return undefined;
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function normalizeShelterItem(row: ShelterRow): ShelterInfoItem {
  const migrated = row.shelter_migrated_data;
  return {
    id: row.id,
    careRegNo: row.care_reg_no?.trim() || undefined,
    careNm: row.care_nm?.trim() || undefined,
    orgNm: row.org_nm?.trim() || pickNestedString(migrated, 'orgNm', 'org_nm'),
    orgCd: pickNestedString(migrated, 'orgCd', 'org_cd'),
    uprCd: pickNestedString(migrated, 'uprCd', 'upr_cd'),
    divisionNm:
      row.division_nm?.trim() || pickNestedString(migrated, 'divisionNm', 'division_nm'),
    saveTrgtAnimal:
      row.save_trgt_animal?.trim() ||
      pickNestedString(migrated, 'saveTrgtAnimal', 'save_trgt_animal'),
    careAddr: row.care_addr?.trim() || pickNestedString(migrated, 'careAddr', 'care_addr'),
    jibunAddr:
      row.jibun_addr?.trim() || pickNestedString(migrated, 'jibunAddr', 'jibun_addr'),
    lat: row.lat ?? pickNestedNumber(migrated, 'lat'),
    lng: row.lng ?? pickNestedNumber(migrated, 'lng'),
    careTel: row.care_tel?.trim() || pickNestedString(migrated, 'careTel', 'care_tel'),
    dsignationDate: pickNestedString(migrated, 'dsignationDate', 'dsignation_date'),
    weekOprStime:
      row.week_opr_stime?.trim() ||
      pickNestedString(migrated, 'weekOprStime', 'week_opr_stime'),
    weekOprEtime:
      row.week_opr_etime?.trim() ||
      pickNestedString(migrated, 'weekOprEtime', 'week_opr_etime'),
    weekCellStime: pickNestedString(migrated, 'weekCellStime', 'week_cell_stime'),
    weekCellEtime: pickNestedString(migrated, 'weekCellEtime', 'week_cell_etime'),
    weekendOprStime:
      row.weekend_opr_stime?.trim() ||
      pickNestedString(migrated, 'weekendOprStime', 'weekend_opr_stime'),
    weekendOprEtime:
      row.weekend_opr_etime?.trim() ||
      pickNestedString(migrated, 'weekendOprEtime', 'weekend_opr_etime'),
    weekendCellStime: pickNestedString(migrated, 'weekendCellStime', 'weekend_cell_stime'),
    weekendCellEtime: pickNestedString(migrated, 'weekendCellEtime', 'weekend_cell_etime'),
    closeDay: row.close_day?.trim() || pickNestedString(migrated, 'closeDay', 'close_day'),
    vetPersonCnt: row.vet_person_cnt ?? pickNestedNumber(migrated, 'vetPersonCnt'),
    specsPersonCnt: row.specs_person_cnt ?? pickNestedNumber(migrated, 'specsPersonCnt'),
    medicalCnt: row.medical_cnt ?? pickNestedNumber(migrated, 'medicalCnt'),
    breedCnt: row.breed_cnt ?? pickNestedNumber(migrated, 'breedCnt'),
    quarabtineCnt: pickNestedNumber(migrated, 'quarabtineCnt'),
    feedCnt: pickNestedNumber(migrated, 'feedCnt'),
    dataStdDt: pickNestedString(migrated, 'dataStdDt', 'data_std_dt'),
  };
}

function matchesSido(item: ShelterInfoItem, sidoName: string): boolean {
  const orgNm = (item.orgNm ?? '').trim();
  const careAddr = (item.careAddr ?? '').trim();
  const jibunAddr = (item.jibunAddr ?? '').trim();
  return [orgNm, careAddr, jibunAddr].some((value) => value.startsWith(sidoName));
}

async function queryShelterDocs(params: ShelterInfoParams): Promise<ShelterInfoItem[]> {
  const pageNo = params.pageNo ?? 1;
  const numOfRows = params.numOfRows ?? 10;
  const fetchLimit = Math.max(pageNo * numOfRows, numOfRows);

  const supabaseAdmin = createSupabaseAdminClient();
  let query = supabaseAdmin
    .from('shelters')
    .select(
      'id, care_reg_no, care_nm, care_addr, jibun_addr, lat, lng, care_tel, close_day, week_opr_stime, week_opr_etime, weekend_opr_stime, weekend_opr_etime, breed_cnt, vet_person_cnt, specs_person_cnt, medical_cnt, save_trgt_animal, division_nm, org_nm, shelter_migrated_data',
    )
    .order('care_nm', { ascending: true })
    .limit(Math.min(fetchLimit * 3, 3000));

  if (params.care_reg_no?.trim()) {
    query = query.eq('care_reg_no', params.care_reg_no.trim());
  }
  if (params.id?.trim()) {
    query = query.eq('id', params.id.trim());
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  let items = (data ?? []).map((row) => normalizeShelterItem(row as ShelterRow));

  if (params.id?.trim()) {
    const shelterId = params.id.trim();
    items = items.filter((item) => item.id === shelterId);
  }
  if (params.care_reg_no?.trim()) {
    const careRegNo = params.care_reg_no.trim();
    items = items.filter((item) => item.careRegNo === careRegNo);
  }

  if (params.upr_cd) {
    const sidoName =
      sidoLocation.items.find((s) => s.SIDO_CD === params.upr_cd)?.SIDO_NAME ?? null;
    items = items.filter((item) => {
      if (item.uprCd) return item.uprCd === params.upr_cd;
      return sidoName ? matchesSido(item, sidoName) : true;
    });
  }

  if (params.org_cd) {
    items = items.filter((item) => item.orgCd === params.org_cd);
  }

  return items.slice(0, fetchLimit);
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const params: ShelterInfoParams = {
      id: sp.get('id') ?? undefined,
      care_reg_no: sp.get('care_reg_no') ?? undefined,
      upr_cd: sp.get('upr_cd') ?? undefined,
      org_cd: sp.get('org_cd') ?? undefined,
      pageNo: Math.max(parseInt(sp.get('pageNo') ?? '1', 10) || 1, 1),
      numOfRows: Math.max(parseInt(sp.get('numOfRows') ?? '10', 10) || 10, 1),
    };

    const allMatches = await queryShelterDocs(params);
    const totalCount = allMatches.length;
    const pageNo = params.pageNo ?? 1;
    const numOfRows = params.numOfRows ?? 10;
    const start = (pageNo - 1) * numOfRows;
    const pageItems = allMatches.slice(start, start + numOfRows);

    return NextResponse.json({
      response: {
        header: {
          reqNo: Date.now(),
          resultCode: '00',
          resultMsg: 'NORMAL SERVICE.',
        },
        body: {
          items: {
            item: pageItems,
          },
          numOfRows,
          pageNo,
          totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Shelter info API (Supabase) error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch shelter info from supabase',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
