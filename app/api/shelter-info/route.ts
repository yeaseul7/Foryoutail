import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { sidoLocation } from '@/static/data/sidoLocation';

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
  const coll = collection(firestore, 'shelter-info');
  const constraints: QueryConstraint[] = [];
  let fallbackConstraints: QueryConstraint[] | null = null;

  if (params.care_reg_no) {
    const careRegNo = params.care_reg_no.trim();
    if (careRegNo) {
      const byDocId = await getDoc(doc(coll, careRegNo));
      if (byDocId.exists()) {
        return [
          normalizeShelterItem(
            byDocId.id,
            byDocId.data() as Record<string, unknown>,
          ),
        ];
      }
      constraints.push(where('careRegNo', '==', careRegNo));
      fallbackConstraints = [where('care_reg_no', '==', careRegNo)];
    }
  }
  if (params.upr_cd) {
    constraints.push(where('uprCd', '==', params.upr_cd));
    fallbackConstraints = (fallbackConstraints ?? []).concat(
      where('upr_cd', '==', params.upr_cd),
    );
  }
  if (params.org_cd) {
    constraints.push(where('orgCd', '==', params.org_cd));
    fallbackConstraints = (fallbackConstraints ?? []).concat(
      where('org_cd', '==', params.org_cd),
    );
  }

  const pageNo = params.pageNo ?? 1;
  const numOfRows = params.numOfRows ?? 10;
  const fetchLimit = Math.max(pageNo * numOfRows, numOfRows);

  const q = constraints.length
    ? query(coll, ...constraints, limit(fetchLimit))
    : query(coll, limit(fetchLimit));
  let snap = await getDocs(q);
  if (snap.empty && fallbackConstraints && fallbackConstraints.length) {
    snap = await getDocs(query(coll, ...fallbackConstraints, limit(fetchLimit)));
  }
  let items = snap.docs.map((d) =>
    normalizeShelterItem(d.id, d.data() as Record<string, unknown>),
  );

  // Firestore 문서에 uprCd/orgCd가 아직 없고 orgNm만 있는 경우를 위한 최종 폴백
  if (items.length === 0 && params.upr_cd) {
    const sidoName =
      sidoLocation.items.find((s) => s.SIDO_CD === params.upr_cd)?.SIDO_NAME ??
      null;
    if (sidoName) {
      const allSnap = await getDocs(query(coll, limit(5000)));
      const allItems = allSnap.docs.map((d) =>
        normalizeShelterItem(d.id, d.data() as Record<string, unknown>),
      );
      items = allItems.filter((item) =>
        (item.orgNm ?? '').startsWith(sidoName),
      );
    }
  }
  return items;
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
