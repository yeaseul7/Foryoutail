'use client';

import { useEffect, useRef, useState } from 'react';
import { MdLocationOn } from 'react-icons/md';
import { getShortSidoName } from '@/packages/utils/locationUtils';

/** 시도 코드별 대략적인 중심 좌표 (WGS84, 지도 영역 표시용) */
const SIDO_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  '6110000': { lat: 37.566535, lng: 126.977969, zoom: 10 },   // 서울 (광화문 기준)
  '6260000': { lat: 35.1796, lng: 129.0756, zoom: 10 },  // 부산
  '6270000': { lat: 35.8714, lng: 128.6014, zoom: 10 },   // 대구
  '6280000': { lat: 37.4563, lng: 126.7052, zoom: 10 },   // 인천
  '6290000': { lat: 35.1595, lng: 126.8526, zoom: 10 },  // 광주
  '5690000': { lat: 36.480, lng: 127.289, zoom: 11 },     // 세종
  '6300000': { lat: 36.3504, lng: 127.3845, zoom: 10 },   // 대전
  '6310000': { lat: 35.5384, lng: 129.3114, zoom: 10 },   // 울산
  '6410000': { lat: 37.4138, lng: 127.5183, zoom: 9 },    // 경기
  '6530000': { lat: 37.8228, lng: 128.1555, zoom: 8 },    // 강원
  '6430000': { lat: 36.6357, lng: 127.4912, zoom: 9 },    // 충북
  '6440000': { lat: 36.5184, lng: 126.8, zoom: 9 },       // 충남
  '6450000': { lat: 35.8204, lng: 127.1089, zoom: 9 },    // 전북
  '6460000': { lat: 34.8161, lng: 126.4629, zoom: 8 },    // 전남
  '6470000': { lat: 36.576, lng: 128.5056, zoom: 8 },     // 경북
  '6480000': { lat: 35.4606, lng: 128.2132, zoom: 8 },    // 경남
  '6500000': { lat: 33.4996, lng: 126.5312, zoom: 10 },   // 제주
};

const DEFAULT_CENTER = { lat: 36.35, lng: 127.77 };
const DEFAULT_ZOOM = 7;

/** 행정구역 GeoJSON (시도 경계) - 로컬 복사본 사용 (CORS 회피, kostat 형식: name, name_eng) */
const SIDO_GEOJSON_URL = '/geo/sido.json';

/** 시도 코드 → GeoJSON feature의 NAME_1 등과 매칭용 이름 (다양한 데이터 소스 대응) */
const SIDO_NAME_MAP: Record<string, string[]> = {
  '6110000': ['Seoul', '서울'],
  '6260000': ['Busan', '부산'],
  '6270000': ['Daegu', '대구'],
  '6280000': ['Incheon', '인천'],
  '6290000': ['Gwangju', '광주'],
  '5690000': ['Sejong', '세종'],
  '6300000': ['Daejeon', '대전'],
  '6310000': ['Ulsan', '울산'],
  '6410000': ['Gyeonggi', 'Gyeonggi-do', '경기'],
  '6530000': ['Gangwon', 'Gangwon-do', '강원'],
  '6430000': ['Chungcheongbuk', 'Chungcheongbuk-do', '충북'],
  '6440000': ['Chungcheongnam', 'Chungcheongnam-do', '충남'],
  '6450000': ['Jeollabuk', 'Jeollabuk-do', '전북'],
  '6460000': ['Jeollanam', 'Jeollanam-do', '전남'],
  '6470000': ['Gyeongsangbuk', 'Gyeongsangbuk-do', '경북'],
  '6480000': ['Gyeongsangnam', 'Gyeongsangnam-do', '경남'],
  '6500000': ['Jeju', 'Jeju-do', '제주'],
};

interface SidoItem {
  SIDO_CD: string;
  SIDO_NAME: string;
}

interface NaverMapOptions {
  center: NaverLatLng;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

interface NaverLatLng {
  lat(): number;
  lng(): number;
}

interface NaverMap {
  setCenter(latlng: NaverLatLng): void;
  setZoom(zoom: number): void;
  setMinZoom(zoom: number): void;
  setMaxZoom(zoom: number): void;
}

/** Data 레이어 Feature (행정구역 등) - getProperty로 속성 조회 */
interface NaverDataFeature {
  getProperty?(key: string): string | undefined;
}

interface NaverDataStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  zIndex?: number;
}

interface NaverData {
  setMap(map: NaverMap | null): void;
  addGeoJson(geojson: unknown): NaverDataFeature[];
  setStyle(style: (feature: NaverDataFeature) => NaverDataStyle): void;
  addListener?(type: string, handler: (e: { feature: NaverDataFeature }) => void): void;
}

interface NaverPolygonOptions {
  map?: NaverMap | null;
  paths: NaverLatLng[] | NaverLatLng[][];
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  zIndex?: number;
}
interface NaverPolygon {
  setMap(map: NaverMap | null): void;
}
interface NaverMapsNamespace {
  Map: new (element: HTMLElement | string, options?: NaverMapOptions) => NaverMap;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Data?: new (options?: { map?: NaverMap | null }) => NaverData;
  Polygon?: new (options: NaverPolygonOptions) => NaverPolygon;
}

export interface RegionMapProps {
  /** 지도 높이 */
  height?: string;
  /** 선택된 시도 코드 (제어 모드) */
  selectedSidoCd?: string | null;
  /** 시도 선택 시 콜백 (필터 연동용) */
  onSidoSelect?: (sidoCd: string | null) => void;
  /** 초기 시도 코드 */
  initialSidoCd?: string | null;
}

export default function RegionMap({
  height = '320px',
  selectedSidoCd,
  onSidoSelect,
  initialSidoCd = '6110000',
}: RegionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dataLayerRef = useRef<NaverData | null>(null);
  const polygonOverlaysRef = useRef<NaverPolygon[]>([]);
  const [map, setMap] = useState<NaverMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidoList, setSidoList] = useState<SidoItem[]>([]);
  const [selectedSido, setSelectedSido] = useState<string | null>(initialSidoCd || null);

  // 네이버 지도 초기화 (마커 없음, 영역만 표시)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { navermap_authFailure?: () => void }).navermap_authFailure = () => {
        setError('네이버 지도 API 인증에 실패했습니다.');
        setIsLoaded(false);
      };
    }

    const checkNaverMap = () => typeof window !== 'undefined' && (window as unknown as { naver?: { maps: NaverMapsNamespace } }).naver?.maps;

    const initMap = () => {
      if (!mapRef.current || !checkNaverMap()) return false;
      if (map) return true;
      try {
        const nm = (window as unknown as { naver: { maps: NaverMapsNamespace } }).naver.maps;
        const center = selectedSido && SIDO_CENTERS[selectedSido]
          ? SIDO_CENTERS[selectedSido]
          : { ...DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
        const mapInstance = new nm.Map(mapRef.current, {
          center: new nm.LatLng(center.lat, center.lng),
          zoom: center.zoom ?? DEFAULT_ZOOM,
          minZoom: 6,
          maxZoom: 18,
        });
        setMap(mapInstance);
        setIsLoaded(true);
        setError(null);
        return true;
      } catch (err) {
        console.error('지도 초기화 오류:', err);
        return false;
      }
    };

    if (checkNaverMap()) {
      initMap();
      return;
    }
    let attempts = 0;
    const t = setInterval(() => {
      attempts++;
      if (checkNaverMap()) {
        clearInterval(t);
        initMap();
      } else if (attempts >= 100) {
        clearInterval(t);
        if (!isLoaded && !error) setError('지도를 불러올 수 없습니다.');
      }
    }, 100);
    return () => clearInterval(t);
    // 마운트 시 1회만 지도 초기화 (map/selectedSido는 별도 effect에서 반영)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 시도 선택 시 지도 중심/줌 이동 (마커 없이 영역만)
  useEffect(() => {
    if (!map) return;
    const nm = (window as unknown as { naver?: { maps: NaverMapsNamespace } }).naver?.maps;
    if (!nm) return;
    const center = selectedSido && SIDO_CENTERS[selectedSido]
      ? SIDO_CENTERS[selectedSido]
      : { ...DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
    map.setCenter(new nm.LatLng(center.lat, center.lng));
    map.setZoom(center.zoom ?? DEFAULT_ZOOM);
  }, [map, selectedSido]);

  // 행정구역 레이어: Data 레이어 또는 Polygon 폴백 (지역별 스타일)
  const geoJsonCacheRef = useRef<{
    type: string;
    features: Array<{
      properties?: Record<string, unknown>;
      geometry?: { type: string; coordinates: number[][][] | number[][][][] };
    }>;
  } | null>(null);

  useEffect(() => {
    if (!map) {
      if (dataLayerRef.current) {
        dataLayerRef.current.setMap(null);
        dataLayerRef.current = null;
      }
      polygonOverlaysRef.current.forEach((p) => p.setMap(null));
      polygonOverlaysRef.current = [];
      geoJsonCacheRef.current = null;
      return;
    }
    const nm = (window as unknown as { naver?: { maps: NaverMapsNamespace } }).naver?.maps;
    if (!nm) return;

    // 1. 이름 매칭 로직 강화 (통계청/다양한 GeoJSON 속성 대응)
    const getFeatureName = (props: Record<string, unknown> | undefined) => {
      if (!props) return '';
      return (
        (props.CTP_KOR_NM as string) ||
        (props.SIDO_NM as string) ||
        (props.NAME_1 as string) ||
        (props.name as string) ||
        (props.name_eng as string) ||
        ''
      );
    };

    const isSidoSelected = (
      props: Record<string, unknown> | undefined,
      selectedCd: string | null
    ) => {
      if (!selectedCd) return false;
      const featureName = getFeatureName(props);
      const targetNames = SIDO_NAME_MAP[selectedCd];
      if (!targetNames || !featureName) return false;
      return targetNames.some(
        (target) => featureName.includes(target) || target.includes(featureName)
      );
    };

    // 2. 스타일 정의 (Data Layer용)
    const getStyle = (feature: NaverDataFeature): NaverDataStyle => {
      const props = {
        CTP_KOR_NM: feature.getProperty?.('CTP_KOR_NM'),
        SIDO_NM: feature.getProperty?.('SIDO_NM'),
        NAME_1: feature.getProperty?.('NAME_1'),
        name: feature.getProperty?.('name'),
        name_eng: feature.getProperty?.('name_eng'),
      } as Record<string, unknown>;
      const selected = isSidoSelected(props, selectedSido ?? null);
      if (selected) {
        return {
          fillColor: '#7c3aed',
          fillOpacity: 0.4,
          strokeColor: '#5b21b6',
          strokeWeight: 3,
          strokeOpacity: 1,
          zIndex: 10,
        };
      }
      return {
        fillColor: '#64748b',
        fillOpacity: 0.2,
        strokeColor: '#94a3b8',
        strokeWeight: 1,
        strokeOpacity: 0.8,
        zIndex: 1,
      };
    };

    // 3. Polygon 폴백 (Data Layer 실패 또는 미지원 시)
    const drawPolygonFallback = (geojson: {
      type: string;
      features: Array<{
        properties?: Record<string, unknown>;
        geometry?: { type: string; coordinates: number[][][] | number[][][][] };
      }>;
    }) => {
      polygonOverlaysRef.current.forEach((p) => p.setMap(null));
      polygonOverlaysRef.current = [];
      if (!nm.Polygon || !geojson.features?.length) return;

      geojson.features.forEach((feature) => {
        const selected = isSidoSelected(feature.properties, selectedSido ?? null);
        const style = {
          fillColor: selected ? '#7c3aed' : '#64748b',
          fillOpacity: selected ? 0.4 : 0.2,
          strokeColor: selected ? '#5b21b6' : '#94a3b8',
          strokeWeight: selected ? 3 : 1,
          strokeOpacity: selected ? 1 : 0.8,
          zIndex: selected ? 10 : 1,
        };

        const geom = feature.geometry;
        if (!geom || !Array.isArray(geom.coordinates)) return;

        const coordinates =
          geom.type === 'MultiPolygon'
            ? (geom.coordinates as number[][][][])
            : [geom.coordinates as number[][][]];

        coordinates.forEach((polygonRings: number[][][]) => {
          const exterior = polygonRings[0];
          if (!exterior?.length) return;
          const path = exterior.map(
            ([lng, lat]: number[]) => new nm.LatLng(lat, lng)
          );
          const polygon = new nm.Polygon!({
            map,
            paths: path,
            ...style,
          });
          polygonOverlaysRef.current.push(polygon);
        });
      });
    };

    // 4. 실행: Data Layer 우선, 실패 시 Polygon 폴백 (선택 시 스타일 갱신을 위해 캐시 있으면 레이어 재생성)
    const applyDataLayer = (geojson: typeof geoJsonCacheRef.current) => {
      if (!geojson || !nm.Data) return;
      if (dataLayerRef.current) {
        dataLayerRef.current.setMap(null);
        dataLayerRef.current = null;
      }
      const dataLayer = new nm.Data({ map });
      dataLayerRef.current = dataLayer;
      try {
        dataLayer.addGeoJson(geojson);
        dataLayer.setStyle(getStyle);
        if (dataLayer.addListener) {
          dataLayer.addListener('click', (e: { feature: NaverDataFeature }) => {
            const props = {
              CTP_KOR_NM: e.feature.getProperty?.('CTP_KOR_NM'),
              SIDO_NM: e.feature.getProperty?.('SIDO_NM'),
              NAME_1: e.feature.getProperty?.('NAME_1'),
              name: e.feature.getProperty?.('name'),
              name_eng: e.feature.getProperty?.('name_eng'),
            } as Record<string, unknown>;
            const clickedName = getFeatureName(props);
            console.log('클릭한 지역:', clickedName);
          });
        }
      } catch (e) {
        console.warn('Data.addGeoJson 실패, Polygon 폴백 사용', e);
        dataLayerRef.current = null;
        drawPolygonFallback(geojson);
      }
    };

    if (nm.Data) {
      if (geoJsonCacheRef.current) {
        applyDataLayer(geoJsonCacheRef.current);
      } else {
        fetch(SIDO_GEOJSON_URL)
          .then((res) => res.json())
          .then((geojson: typeof geoJsonCacheRef.current) => {
            if (!geojson) return;
            geoJsonCacheRef.current = geojson;
            applyDataLayer(geojson);
          })
          .catch((err) => {
            console.warn('Data Layer 오류, Polygon 폴백 실행', err);
            dataLayerRef.current = null;
            if (geoJsonCacheRef.current) {
              drawPolygonFallback(geoJsonCacheRef.current);
            } else {
              fetch(SIDO_GEOJSON_URL)
                .then((res) => res.json())
                .then((g: typeof geoJsonCacheRef.current) => {
                  if (g) {
                    geoJsonCacheRef.current = g;
                    drawPolygonFallback(g);
                  }
                })
                .catch((e) => console.error('행정구역 GeoJSON 로드 실패', e));
            }
          });
      }
    } else {
      if (geoJsonCacheRef.current) {
        drawPolygonFallback(geoJsonCacheRef.current);
      } else {
        fetch(SIDO_GEOJSON_URL)
          .then((res) => res.json())
          .then((geojson: typeof geoJsonCacheRef.current) => {
            if (geojson) {
              geoJsonCacheRef.current = geojson;
              drawPolygonFallback(geojson);
            }
          })
          .catch((err) => console.error('행정구역 GeoJSON 로드 실패', err));
      }
    }
  }, [map, selectedSido]);

  // 시도 목록 로드
  useEffect(() => {
    const raw = localStorage.getItem('sido_data');
    if (!raw) return;
    try {
      const data: SidoItem[] = JSON.parse(raw);
      queueMicrotask(() => setSidoList(data));
    } catch (e) {
      console.error('시도 데이터 파싱 오류:', e);
    }
  }, []);

  // 외부 selectedSidoCd 동기화
  useEffect(() => {
    if (selectedSidoCd !== undefined) setSelectedSido(selectedSidoCd);
  }, [selectedSidoCd]);

  useEffect(() => {
    if (initialSidoCd) setSelectedSido(initialSidoCd);
  }, [initialSidoCd]);

  const handleSidoSelect = (sidoCd: string | null) => {
    setSelectedSido(sidoCd);
    onSidoSelect?.(sidoCd);
  };

  const isAll = selectedSido === null || selectedSido === '';

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더: 보라색 핀 아이콘 + 지역별 보기 */}
      <div className="flex items-center gap-2 px-4 py-3 ">
        <MdLocationOn className="w-5 h-5 text-primary1 shrink-0" aria-hidden />
        <h3 className="text-base font-bold text-gray-900 py-2">지역별 보기</h3>
      </div>

      {error ? (
        <div className="flex items-center justify-center min-h-[200px] bg-slate-100/80 text-gray-600 text-sm mx-3 my-3 rounded-xl">
          {error}
        </div>
      ) : (
        <>
          {/* 지도 영역: 연한 청회색 톤 */}
          <div className="relative mx-3 rounded-xl overflow-hidden bg-slate-100/90 border border-slate-200/80">
            <div
              ref={mapRef}
              style={{ width: '100%', height, minHeight: height }}
              className="rounded-xl"
            />
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
                <p className="text-gray-500 text-sm">지도를 불러오는 중...</p>
              </div>
            )}
          </div>

          {/* 하단 지역 필터: 전국 + 시도 그리드 4열 (전국이 맨 앞) */}
          {sidoList.length > 0 && (
            <div className="p-3 pt-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { SIDO_CD: null, SIDO_NAME: '전국' } as { SIDO_CD: string | null; SIDO_NAME: string },
                  ...sidoList,
                ].map((sido) => {
                  const isAllItem = sido.SIDO_CD === null;
                  const isSelected = isAllItem ? isAll : selectedSido === sido.SIDO_CD;
                  return (
                    <button
                      key={sido.SIDO_CD ?? 'all'}
                      type="button"
                      onClick={() => handleSidoSelect(sido.SIDO_CD)}
                      className={`py-2 rounded-full border text-sm font-medium transition-colors ${isSelected ? 'bg-primary1 text-white border-primary1' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${isAllItem ? 'text-xs' : ''}`}
                    >
                      {isAllItem ? '전국' : getShortSidoName(sido.SIDO_NAME)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
