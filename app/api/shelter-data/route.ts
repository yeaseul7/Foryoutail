import { ShelterAnimalItem } from '@/packages/type/postType';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2';

interface ShelterDataParams {
  bgnde?: string; // 구조날짜(검색 시작일)(YYYYMMDD)
  endde?: string; // 구조날짜(검색 종료일)(YYYYMMDD)
  upkind?: string; // 축종코드 (개 : 417000, 고양이 : 422400, 기타 : 429900)
  kind?: string; // 품종코드
  upr_cd?: string; // 시도코드
  org_cd?: string; // 시군구코드
  care_reg_no?: string; // 보호소번호
  state?: string; // 상태(전체 : null(빈값), 공고중 : notice, 보호중 : protect)
  neuter_yn?: string; // 중성화 여부 (전체 : null(빈값), 예 : Y, 아니오 : N, 미상 : U)
  pageNo?: string; // 페이지 번호 (기본값 : 1)
  numOfRows?: string; // 페이지당 보여줄 개수 (1,000 이하), 기본값 : 10
  _type?: string; // xml(기본값) 또는 json
  bgupd?: string; // 수정날짜(검색 시작일)(YYYYMMDD)
  enupd?: string; // 수정날짜(검색 종료일)(YYYYMMDD)
  sex_cd?: string; // 성별 - 전체 : null(빈값) - 수컷 : M - 암컷 : F - 미상 : Q
  rfid_cd?: string; // 동물등록번호(RFID 번호)
  desertion_no?: string; // 유기번호
  notice_no?: string; // 공고번호
  searchQuery?: string; // 검색어 (rfidCd, happenPlace, careAddr, careNm)
}

export async function GET(request: NextRequest) {
  try {
    const serviceKey = process.env.NEXT_PUBLIC_ANIMALS_OPENAPI;

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 },
      );
    }

    // URL 쿼리 파라미터에서 요청 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const params: ShelterDataParams = {};

    // 각 파라미터를 조건부로 추가
    if (searchParams.has('bgnde')) params.bgnde = searchParams.get('bgnde')!;
    if (searchParams.has('endde')) params.endde = searchParams.get('endde')!;
    if (searchParams.has('upkind')) params.upkind = searchParams.get('upkind')!;
    if (searchParams.has('kind')) params.kind = searchParams.get('kind')!;
    if (searchParams.has('upr_cd'))
      params.upr_cd = searchParams.get('upr_cd')!;
    if (searchParams.has('org_cd'))
      params.org_cd = searchParams.get('org_cd')!;
    if (searchParams.has('care_reg_no'))
      params.care_reg_no = searchParams.get('care_reg_no')!;
    if (searchParams.has('state')) params.state = searchParams.get('state')!;
    if (searchParams.has('neuter_yn'))
      params.neuter_yn = searchParams.get('neuter_yn')!;
    if (searchParams.has('pageNo'))
      params.pageNo = searchParams.get('pageNo')!;
    if (searchParams.has('numOfRows'))
      params.numOfRows = searchParams.get('numOfRows')!;
    if (searchParams.has('_type')) params._type = searchParams.get('_type')!;
    if (searchParams.has('bgupd')) params.bgupd = searchParams.get('bgupd')!;
    if (searchParams.has('enupd')) params.enupd = searchParams.get('enupd')!;
    if (searchParams.has('sex_cd'))
      params.sex_cd = searchParams.get('sex_cd')!;
    if (searchParams.has('rfid_cd'))
      params.rfid_cd = searchParams.get('rfid_cd')!;
    if (searchParams.has('desertion_no'))
      params.desertion_no = searchParams.get('desertion_no')!;
    if (searchParams.has('notice_no'))
      params.notice_no = searchParams.get('notice_no')!;
    if (searchParams.has('searchQuery'))
      params.searchQuery = searchParams.get('searchQuery')!;

    const pageNo = params.pageNo || '1';
    const numOfRows = params.numOfRows || '1000';
    const _type = params._type || 'json';

    const urlParams = new URLSearchParams();
    urlParams.append('serviceKey', serviceKey);
    urlParams.append('pageNo', pageNo);
    urlParams.append('numOfRows', numOfRows);
    urlParams.append('_type', _type);

    if (params.bgnde) urlParams.append('bgnde', params.bgnde);
    if (params.endde) urlParams.append('endde', params.endde);
    if (params.upkind) urlParams.append('upkind', params.upkind);
    if (params.kind) urlParams.append('kind', params.kind);
    if (params.upr_cd) urlParams.append('upr_cd', params.upr_cd);
    if (params.org_cd) urlParams.append('org_cd', params.org_cd);
    if (params.care_reg_no) urlParams.append('care_reg_no', params.care_reg_no);
    if (params.state) urlParams.append('state', params.state);
    if (params.neuter_yn) urlParams.append('neuter_yn', params.neuter_yn);
    if (params.bgupd) urlParams.append('bgupd', params.bgupd);
    if (params.enupd) urlParams.append('enupd', params.enupd);
    if (params.sex_cd) urlParams.append('sex_cd', params.sex_cd);
    if (params.rfid_cd) urlParams.append('rfid_cd', params.rfid_cd);
    if (params.desertion_no)
      urlParams.append('desertion_no', params.desertion_no);
    if (params.notice_no) urlParams.append('notice_no', params.notice_no);

    const apiUrl = `${API_BASE_URL}/abandonmentPublic_v2?${urlParams.toString()}`;
    // 공공데이터포털 API는 응답이 수 초 걸리는 경우가 흔함. 동일 쿼리는 짧게 캐시해 체감 지연·부하를 줄임.
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to fetch data from public API',
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (params.searchQuery && data?.response?.body?.items?.item) {
      const searchLower = params.searchQuery.toLowerCase();
      const items = data.response.body.items.item;
      const itemsArray = Array.isArray(items) ? items : [items];

      const filteredItems = itemsArray.filter((item: ShelterAnimalItem) => {
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

      // 필터링된 결과로 업데이트
      if (Array.isArray(items)) {
        data.response.body.items.item = filteredItems;
      } else {
        data.response.body.items.item = filteredItems.length > 0 ? filteredItems[0] : null;
      }

      // totalCount도 업데이트
      if (data.response.body.totalCount) {
        data.response.body.totalCount = filteredItems.length;
      }
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 브라우저 재방문·탭 전환 시 동일 URL은 잠시 재사용 (개인정보 없는 공개 목록 전제)
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
