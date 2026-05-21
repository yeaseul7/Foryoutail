let naverMapScriptPromise: Promise<void> | null = null;

export function loadNaverMapsScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.naver?.maps) {
    return Promise.resolve();
  }

  const ncpKeyId = process.env.NEXT_PUBLIC_NAVER_MAP;
  if (!ncpKeyId) {
    return Promise.reject(new Error('네이버 지도 API 키가 설정되지 않았습니다.'));
  }

  if (naverMapScriptPromise) {
    return naverMapScriptPromise;
  }

  naverMapScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById('naver-map-script') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('네이버 지도 API를 로드할 수 없습니다.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'naver-map-script';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpKeyId}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('네이버 지도 API를 로드할 수 없습니다.'));
    document.head.appendChild(script);
  });

  return naverMapScriptPromise;
}
