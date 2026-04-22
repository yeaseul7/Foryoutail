import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/** coord2jibun API 응답을 getAddress와 동일한 형식으로 변환 (프론트 호환) */
function normalizeCoord2JibunResponse(addr: string): { response: { status: string; result: Array<{ structure: { level1: string } }> } } {
  // 지번주소 첫 토큰이 시/도 (예: 서울특별시, 경기도, 세종특별자치시)
  const level1 = addr?.split(/\s+/)[0]?.trim() || '';
  return {
    response: {
      status: 'OK',
      result: [{ structure: { level1 } }],
    },
  };
}

/** 502/503 시 대안 API (coord2jibun) 호출 */
async function tryCoord2JibunFallback(
  apiKey: string,
  longitude: string,
  latitude: string,
  fetchOptions: { headers: Record<string, string> }
): Promise<{ response: { status: string; result: Array<{ structure: { level1: string } }> } } | null> {
  const url = `https://apis.vworld.kr/coord2jibun.do?x=${longitude}&y=${latitude}&apiKey=${apiKey}&output=json&epsg=EPSG:4326`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    if (!res.ok) return null;
    const data = JSON.parse(text);
    const addr = data?.result?.jibun?.addr ?? data?.addr ?? data?.ADDR ?? (typeof data === 'string' ? data : '');
    if (!addr || typeof addr !== 'string') return null;
    return normalizeCoord2JibunResponse(addr);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const longitude = searchParams.get('longitude');
  const latitude = searchParams.get('latitude');

  if (!longitude || !latitude) {
    return NextResponse.json(
      { error: '경도와 위도가 필요합니다.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

  if (!apiKey) {
    console.error('VWorld API 키가 설정되지 않았습니다.');
    return NextResponse.json(
      { error: 'VWorld API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const fetchOptions = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Kkosunnae/1.0 (Address Lookup)',
    },
  };

  try {
    const apiUrl = `https://api.vworld.kr/req/address?service=address&request=getAddress&key=${apiKey}&point=${longitude},${latitude}&type=both&format=json`;

    // 재시도 로직 (최대 3번)
    let lastError: Error | null = null;
    let response: Response | null = null;
    let responseText: string = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        response = await fetch(apiUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseText = await response.text();
        break;
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        if (attempt < 3) {
          console.warn(`VWorld API 호출 실패 (시도 ${attempt}/3), 재시도 중...`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw lastError;
      }
    }

    if (!response) {
      throw new Error('API 응답을 받지 못했습니다.');
    }

    // 502/503 등 업스트림 오류 시 coord2jibun 대안 API 시도
    const isUpstreamError = response.status === 502 || response.status === 503;
    const isHtmlResponse = responseText.trimStart().toLowerCase().startsWith('<!DOCTYPE') || responseText.trimStart().toLowerCase().startsWith('<html');
    if (isUpstreamError && isHtmlResponse) {
      const fallbackData = await tryCoord2JibunFallback(apiKey, longitude, latitude, fetchOptions);
      if (fallbackData) {
        return NextResponse.json(fallbackData);
      }
      return NextResponse.json(
        {
          error: '주소 변환 서비스를 일시적으로 사용할 수 없습니다.',
          message: 'VWorld 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      console.error('VWorld API 호출 실패:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText.substring(0, 500),
      });
      return NextResponse.json(
        {
          error: 'VWorld API 호출 실패',
          status: response.status,
          details: responseText.substring(0, 500)
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError, 'Response:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'API 응답 파싱 실패', details: responseText.substring(0, 500) },
        { status: 500 }
      );
    }

    // VWorld API 에러 응답 확인
    if (data.response?.status === 'ERROR') {
      console.error('VWorld API 에러 응답:', data);
      return NextResponse.json(
        {
          error: '주소 변환 실패',
          message: data.response?.text || '알 수 없는 오류'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);

    let errorMessage = '알 수 없는 오류';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // 네트워크 에러 처리
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = '요청 시간 초과';
        statusCode = 504;
      } else if (error.message.includes('fetch failed') || error.message.includes('UND_ERR_SOCKET')) {
        errorMessage = 'VWorld API 서버와의 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
        statusCode = 503; // Service Unavailable
      }
    }

    return NextResponse.json(
      {
        error: '주소 변환 중 오류가 발생했습니다.',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}
