import { NextRequest, NextResponse } from 'next/server';

// API 응답 타입 정의
interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

interface SidoApiResponse {
  resultCode: string;
  resultMsg: string;
  totalCount: number;
  items: SidoItem[];
}

// 새로운 API 응답 구조 (abandonmentPublicService_v2)
interface SidoApiRawItem {
  orgCd: string;
  orgdownNm: string;
}

interface SidoApiRawResponse {
  response: {
    header: {
      reqNo: number;
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: SidoApiRawItem | SidoApiRawItem[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 타입 가드 함수
function isSidoApiRawResponse(data: unknown): data is SidoApiRawResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'response' in data &&
    typeof (data as { response?: unknown }).response === 'object' &&
    (data as { response?: unknown }).response !== null &&
    'header' in (data as { response?: { header?: unknown } }).response! &&
    'body' in (data as { response?: { body?: unknown } }).response!
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageNo = searchParams.get('pageNo') || '1';
  const numOfRows = searchParams.get('numOfRows') || '100';

  // 보호소 정보 API와 동일한 서비스의 시도 조회 API 사용
  const apiKey = process.env.NEXT_PUBLIC_ANIMALS_OPENAPI;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    // 농림축산식품부 농림축산검역본부_국가동물보호정보시스템 구조동물 조회 서비스
    // https://www.data.go.kr/data/15098931/openapi.do
    const API_BASE_URL = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2';

    const params = new URLSearchParams({
      serviceKey: apiKey,
      pageNo: pageNo,
      numOfRows: numOfRows,
      _type: 'json',
    });

    const url = `${API_BASE_URL}/sido_v2?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    // 에러 응답 확인
    if (!response.ok) {
      console.error('API 응답 오류:', response.status, responseText);
      return NextResponse.json(
        {
          error: '시도 조회 API 호출 실패',
          status: response.status,
          message: responseText.substring(0, 500)
        },
        { status: response.status }
      );
    }

    // JSON 형식인지 확인
    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      // XML 형식인 경우 파싱
      const jsonData: SidoApiResponse = parseXmlToJson(responseText);

      if (jsonData.resultCode && jsonData.resultCode !== '00' && jsonData.resultCode !== '0') {
        return NextResponse.json(
          {
            error: jsonData.resultMsg || 'API 응답 오류',
            resultCode: jsonData.resultCode,
            resultMsg: jsonData.resultMsg,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(jsonData);
    }

    // 타입 가드: SidoApiRawResponse인지 확인
    if (isSidoApiRawResponse(data)) {
      const rawData = data;

      // API 응답 구조 확인 (response.header.resultCode)
      if (rawData.response.header.resultCode && rawData.response.header.resultCode !== '00') {
        return NextResponse.json(
          {
            error: rawData.response.header.resultMsg || 'API 응답 오류',
            resultCode: rawData.response.header.resultCode,
            resultMsg: rawData.response.header.resultMsg,
          },
          { status: 400 }
        );
      }

      // 새로운 API 형식에서 기존 형식으로 변환
      if (rawData.response.body.items?.item) {
        const items = Array.isArray(rawData.response.body.items.item)
          ? rawData.response.body.items.item
          : [rawData.response.body.items.item];

        // orgCd, orgdownNm을 SIDO_CD, SIDO_NAME으로 변환
        const convertedItems: SidoItem[] = items.map((item) => ({
          SIDO_CD: item.orgCd || '',
          SIDO_NAME: item.orgdownNm || '',
        })).filter((item) => item.SIDO_CD && item.SIDO_NAME);

        const jsonData: SidoApiResponse = {
          resultCode: rawData.response.header.resultCode || '00',
          resultMsg: rawData.response.header.resultMsg || 'NORMAL SERVICE',
          totalCount: rawData.response.body.totalCount || convertedItems.length,
          items: convertedItems,
        };

        return NextResponse.json(jsonData);
      }
    }

    // 기존 형식 그대로 반환 (fallback)
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('SIDO API error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      {
        error: '시도 코드 조회 중 오류가 발생했습니다.',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

// XML to JSON 변환 함수 (fallback)
function parseXmlToJson(xmlText: string): SidoApiResponse {
  try {
    const items: SidoItem[] = [];

    // 공공데이터포털 XML 구조에 맞게 파싱
    // <item> 또는 <items><item> 구조 지원
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      // 새로운 API 형식: orgCd, orgdownNm
      const orgCdMatch = itemContent.match(/<orgCd[^>]*>([^<]*)<\/orgCd>/i) ||
        itemContent.match(/<org_cd[^>]*>([^<]*)<\/org_cd>/i);
      const orgdownNmMatch = itemContent.match(/<orgdownNm[^>]*>([^<]*)<\/orgdownNm>/i) ||
        itemContent.match(/<orgdown_nm[^>]*>([^<]*)<\/orgdown_nm>/i);

      // 기존 형식: SIDO_CD, SIDO_NAME (fallback)
      const sidoCdMatch = itemContent.match(/<SIDO_CD[^>]*>([^<]*)<\/SIDO_CD>/i) ||
        itemContent.match(/<sido_cd[^>]*>([^<]*)<\/sido_cd>/i);
      const sidoNameMatch = itemContent.match(/<SIDO_NAME[^>]*>([^<]*)<\/SIDO_NAME>/i) ||
        itemContent.match(/<sido_name[^>]*>([^<]*)<\/sido_name>/i);

      if (orgCdMatch && orgdownNmMatch) {
        items.push({
          SIDO_CD: orgCdMatch[1].trim(),
          SIDO_NAME: orgdownNmMatch[1].trim(),
        });
      } else if (sidoCdMatch && sidoNameMatch) {
        items.push({
          SIDO_CD: sidoCdMatch[1].trim(),
          SIDO_NAME: sidoNameMatch[1].trim(),
        });
      }
    }

    // 헤더 정보 추출 (대소문자 구분 없이)
    const resultCodeMatch = xmlText.match(/<resultCode[^>]*>([^<]*)<\/resultCode>/i) ||
      xmlText.match(/<result_code[^>]*>([^<]*)<\/result_code>/i);
    const resultMsgMatch = xmlText.match(/<resultMsg[^>]*>([^<]*)<\/resultMsg>/i) ||
      xmlText.match(/<result_msg[^>]*>([^<]*)<\/result_msg>/i);
    const totalCountMatch = xmlText.match(/<totalCount[^>]*>([^<]*)<\/totalCount>/i) ||
      xmlText.match(/<total_count[^>]*>([^<]*)<\/total_count>/i);

    const resultCode = resultCodeMatch ? resultCodeMatch[1].trim() : '';
    const resultMsg = resultMsgMatch ? resultMsgMatch[1].trim() : '';
    const totalCount = totalCountMatch ? parseInt(totalCountMatch[1].trim()) || 0 : 0;

    // 에러 응답 확인
    if (resultCode && resultCode !== '00' && resultCode !== '0' && resultCode !== '') {
      return {
        resultCode,
        resultMsg: resultMsg || 'API 오류',
        totalCount: 0,
        items: [],
      };
    }

    return {
      resultCode: resultCode || '00',
      resultMsg: resultMsg || 'NORMAL SERVICE',
      totalCount,
      items,
    };
  } catch (error: unknown) {
    console.error('XML 파싱 오류:', error);
    console.error('XML 텍스트 (처음 1000자):', xmlText.substring(0, 1000));
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const errorResponse: SidoApiResponse = {
      resultCode: 'ERROR',
      resultMsg: `XML 파싱 실패: ${errorMessage}`,
      totalCount: 0,
      items: [],
    };
    return errorResponse;
  }
}
