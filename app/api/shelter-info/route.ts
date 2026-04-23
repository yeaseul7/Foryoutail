import { NextRequest, NextResponse } from 'next/server';
import {
  getFirestoreDocument,
  runFirestoreCollectionQuery,
} from '@/lib/server/firestore-rest';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { sidoLocation } from '@/static/data/sidoLocation';

export const runtime = 'edge';

interface ShelterInfoParams {
  care_reg_no?: string;
  upr_cd?: string;
  org_cd?: string;
  pageNo?: number;
  numOfRows?: number;
}

function normalizeShelterItem(
  id: string,
  raw: Record<string, unknown>,
): ShelterInfoItem {
  const pickString = (v: unknown) => (typeof v === 'string' ? v : undefined);
  const pickNumber = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  return {
    careRegNo:
      pickString(raw.careRegNo) ??
      pickString(raw.care_reg_no) ??
      id,
    careNm: pickString(raw.careNm) ?? pickString(raw.care_nm),
    orgNm: pickString(raw.orgNm) ?? pickString(raw.org_nm),
    orgCd: pickString(raw.orgCd) ?? pickString(raw.org_cd),
    uprCd: pickString(raw.uprCd) ?? pickString(raw.upr_cd),
    divisionNm: pickString(raw.divisionNm) ?? pickString(raw.division_nm),
    saveTrgtAnimal:
      pickString(raw.saveTrgtAnimal) ?? pickString(raw.save_trgt_animal),
    careAddr: pickString(raw.careAddr) ?? pickString(raw.care_addr),
    jibunAddr: pickString(raw.jibunAddr) ?? pickString(raw.jibun_addr),
    lat: pickNumber(raw.lat),
    lng: pickNumber(raw.lng),
    careTel: pickString(raw.careTel) ?? pickString(raw.care_tel),
    dsignationDate:
      pickString(raw.dsignationDate) ?? pickString(raw.dsignation_date),
    weekOprStime:
      pickString(raw.weekOprStime) ?? pickString(raw.week_opr_stime),
    weekOprEtime:
      pickString(raw.weekOprEtime) ?? pickString(raw.week_opr_etime),
    weekCellStime:
      pickString(raw.weekCellStime) ?? pickString(raw.week_cell_stime),
    weekCellEtime:
      pickString(raw.weekCellEtime) ?? pickString(raw.week_cell_etime),
    weekendOprStime:
      pickString(raw.weekendOprStime) ?? pickString(raw.weekend_opr_stime),
    weekendOprEtime:
      pickString(raw.weekendOprEtime) ?? pickString(raw.weekend_opr_etime),
    weekendCellStime:
      pickString(raw.weekendCellStime) ?? pickString(raw.weekend_cell_stime),
    weekendCellEtime:
      pickString(raw.weekendCellEtime) ?? pickString(raw.weekend_cell_etime),
    closeDay: pickString(raw.closeDay) ?? pickString(raw.close_day),
    vetPersonCnt: pickNumber(raw.vetPersonCnt),
    specsPersonCnt: pickNumber(raw.specsPersonCnt),
    medicalCnt: pickNumber(raw.medicalCnt),
    breedCnt: pickNumber(raw.breedCnt),
    quarabtineCnt: pickNumber(raw.quarabtineCnt),
    feedCnt: pickNumber(raw.feedCnt),
    dataStdDt: pickString(raw.dataStdDt) ?? pickString(raw.data_std_dt),
  };
}

async function queryShelterDocs(params: ShelterInfoParams): Promise<ShelterInfoItem[]> {
  if (params.care_reg_no) {
    const careRegNo = params.care_reg_no.trim();
    if (careRegNo) {
      const byDocId = await getFirestoreDocument('shelter-info', careRegNo);
      if (byDocId) return [normalizeShelterItem(byDocId.id, byDocId.data)];
    }
  }

  const pageNo = params.pageNo ?? 1;
  const numOfRows = params.numOfRows ?? 10;
  const fetchLimit = Math.max(pageNo * numOfRows, numOfRows);
  const filters: Parameters<typeof runFirestoreCollectionQuery>[0]['filters'] = [];

  if (params.care_reg_no) {
    filters.push({ field: 'careRegNo', op: 'EQUAL', value: params.care_reg_no.trim() });
  }
  if (params.upr_cd) filters.push({ field: 'uprCd', op: 'EQUAL', value: params.upr_cd });
  if (params.org_cd) filters.push({ field: 'orgCd', op: 'EQUAL', value: params.org_cd });

  const rows = await runFirestoreCollectionQuery({
    collectionId: 'shelter-info',
    filters,
    limit: fetchLimit,
  });
  let items = rows.map((row) => normalizeShelterItem(row.id, row.data));

  if (params.care_reg_no) {
    const careRegNo = params.care_reg_no.trim();
    items = items.filter((item) => item.careRegNo === careRegNo);
  }
  if (params.upr_cd) {
    items = items.filter((item) => item.uprCd === params.upr_cd);
  }
  if (params.org_cd) {
    items = items.filter((item) => item.orgCd === params.org_cd);
  }

  // Firestore 문서에 uprCd/orgCd가 아직 없고 orgNm만 있는 경우를 위한 최종 폴백
  if (items.length === 0 && params.upr_cd) {
    const sidoName =
      sidoLocation.items.find((s) => s.SIDO_CD === params.upr_cd)?.SIDO_NAME ??
      null;
    if (sidoName) {
      const fallbackRows = await runFirestoreCollectionQuery({
        collectionId: 'shelter-info',
        filters: [
          { field: 'orgNm', op: 'GREATER_THAN_OR_EQUAL', value: sidoName },
          { field: 'orgNm', op: 'LESS_THAN_OR_EQUAL', value: `${sidoName}\uf8ff` },
        ],
        limit: fetchLimit,
      });
      items = fallbackRows.map((row) => normalizeShelterItem(row.id, row.data));
    }
  }
  return items.slice(0, fetchLimit);
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const params: ShelterInfoParams = {
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
    console.error('Shelter info API (Firestore) error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch shelter info from firestore',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
