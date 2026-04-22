import { NextRequest, NextResponse } from 'next/server';
import type { ShelterDataFirestoreParams } from '@/lib/utils/shelterAnimalsFirestore';
import {
  buildShelterDataJsonForDesertionNo,
  buildShelterDataJsonFromQueryResult,
  queryShelterAnimalsFromFirestore,
} from '@/lib/utils/shelterAnimalsFirestore';

export const runtime = 'edge';

function parseShelterDataParams(searchParams: URLSearchParams): ShelterDataFirestoreParams {
  const params: ShelterDataFirestoreParams = {};
  if (searchParams.has('bgnde')) params.bgnde = searchParams.get('bgnde')!;
  if (searchParams.has('endde')) params.endde = searchParams.get('endde')!;
  if (searchParams.has('upkind')) params.upkind = searchParams.get('upkind')!;
  if (searchParams.has('kind')) params.kind = searchParams.get('kind')!;
  if (searchParams.has('upr_cd')) params.upr_cd = searchParams.get('upr_cd')!;
  if (searchParams.has('org_cd')) params.org_cd = searchParams.get('org_cd')!;
  if (searchParams.has('care_reg_no'))
    params.care_reg_no = searchParams.get('care_reg_no')!;
  if (searchParams.has('state')) params.state = searchParams.get('state')!;
  if (searchParams.has('neuter_yn'))
    params.neuter_yn = searchParams.get('neuter_yn')!;
  if (searchParams.has('pageNo')) params.pageNo = searchParams.get('pageNo')!;
  if (searchParams.has('numOfRows'))
    params.numOfRows = searchParams.get('numOfRows')!;
  if (searchParams.has('_type')) params._type = searchParams.get('_type')!;
  if (searchParams.has('bgupd')) params.bgupd = searchParams.get('bgupd')!;
  if (searchParams.has('enupd')) params.enupd = searchParams.get('enupd')!;
  if (searchParams.has('sex_cd')) params.sex_cd = searchParams.get('sex_cd')!;
  if (searchParams.has('rfid_cd')) params.rfid_cd = searchParams.get('rfid_cd')!;
  if (searchParams.has('desertion_no'))
    params.desertion_no = searchParams.get('desertion_no')!;
  if (searchParams.has('notice_no'))
    params.notice_no = searchParams.get('notice_no')!;
  if (searchParams.has('orgNm')) params.orgNm = searchParams.get('orgNm')!;
  if (searchParams.has('org_nm')) params.orgNm = searchParams.get('org_nm')!;
  if (searchParams.has('searchQuery'))
    params.searchQuery = searchParams.get('searchQuery')!;
  return params;
}

export async function GET(request: NextRequest) {
  try {
    const params = parseShelterDataParams(request.nextUrl.searchParams);

    const data = params.desertion_no?.trim()
      ? await buildShelterDataJsonForDesertionNo(params)
      : buildShelterDataJsonFromQueryResult(await queryShelterAnimalsFromFirestore(params));

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Shelter data API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch shelter data',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
