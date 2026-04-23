'use client';

import { useEffect, useRef, useState } from 'react';

interface ShelterMapComponentProps {
    lat: number;
    lng: number;
    zoom?: number;
    height?: string;
    title?: string;
    address?: string;
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

interface NaverMarker {
    setMap(map: NaverMap | null): void;
    setPosition(position: NaverLatLng): void;
}

interface NaverInfoWindow {
    open(map: NaverMap, marker: NaverMarker): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
}

export default function ShelterMapComponent({
    lat,
    lng,
    zoom = 15,
    height = '400px',
    title,
    address,
}: ShelterMapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<NaverMap | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const markerRef = useRef<NaverMarker | null>(null);
    const infoWindowRef = useRef<NaverInfoWindow | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as Window & { navermap_authFailure?: () => void }).navermap_authFailure = () => {
                console.error('네이버 지도 API 인증 실패');
                setError('네이버 지도 API 인증에 실패했습니다. 클라이언트 ID와 서비스 URL을 확인하세요.');
                setIsLoaded(false);
            };
        }

        const checkNaverMap = () => {
            if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
                return true;
            }
            return false;
        };

        const initializeMap = () => {
            if (!mapRef.current || !checkNaverMap()) {
                return false;
            }

            if (map) {
                return true;
            }

            try {
                const mapOptions: NaverMapOptions = {
                    center: new window.naver.maps.LatLng(lat, lng),
                    zoom: zoom,
                    minZoom: 6,
                    maxZoom: 18,
                };

                const mapInstance = new window.naver.maps.Map(mapRef.current, mapOptions);

                if (mapInstance.setMinZoom) {
                    mapInstance.setMinZoom(6);
                }

                // 마커 생성
                const position = new window.naver.maps.LatLng(lat, lng);
                const marker = new window.naver.maps.Marker({
                    position: position,
                    map: mapInstance,
                    title: title || '위치',
                });

                // 정보창 생성 (제목이나 주소가 있을 경우)
                if (title || address) {
                    const infoWindow = new window.naver.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; min-width: 200px;">
                                ${title ? `<h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${title}</h3>` : ''}
                                ${address ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">📍 ${address}</p>` : ''}
                            </div>
                        `,
                        maxWidth: 300,
                    });

                    infoWindowRef.current = infoWindow;

                    // 마커 클릭 시 정보창 표시
                    window.naver.maps.Event.addListener(marker, 'click', () => {
                        if (infoWindowRef.current) {
                            infoWindowRef.current.open(mapInstance, marker);
                        }
                    });
                }

                markerRef.current = marker;
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
            initializeMap();
            return;
        }

        let attemptCount = 0;
        const maxAttempts = 100;

        const interval = setInterval(() => {
            attemptCount++;
            if (checkNaverMap()) {
                clearInterval(interval);
                const success = initializeMap();
                if (!success && attemptCount >= maxAttempts) {
                    setError('지도를 초기화할 수 없습니다. 잠시 후 다시 시도해주세요.');
                }
            } else if (attemptCount >= maxAttempts) {
                clearInterval(interval);
                if (!isLoaded && !error) {
                    setError('네이버 지도 API를 로드할 수 없습니다. 네트워크 연결을 확인하세요.');
                }
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [lat, lng, zoom, map, isLoaded, error, title, address]);

    // 위도/경도가 변경되면 지도 중심 이동
    useEffect(() => {
        if (map && window.naver && window.naver.maps && markerRef.current) {
            const newPosition = new window.naver.maps.LatLng(lat, lng);
            map.setCenter(newPosition);
            map.setZoom(zoom);
            markerRef.current.setPosition(newPosition);
        }
    }, [lat, lng, zoom, map]);

    return (
        <div className="w-full">
            {error ? (
                <div className="flex items-center justify-center h-full min-h-[400px] bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-center p-6">
                        <div className="text-red-600 text-lg font-semibold mb-2">⚠️ 지도 로드 실패</div>
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div
                        ref={mapRef}
                        style={{ width: '100%', height, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}
                        className="rounded-lg border border-gray-200 overflow-hidden"
                    />
                    {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">지도를 불러오는 중...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}