'use client';

import { useEffect } from 'react';
import { sidoLocation } from '@/static/data/sidoLocation';

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

interface MatchedAddress {
  level1: string;
  sidoCd: string;
  sidoName: string;
}

export default function LocationDataProvider() {
  useEffect(() => {
    const fetchAndStoreSidoData = async () => {
      try {
        const storedData = localStorage.getItem('sido_data');
        const storedTimestamp = localStorage.getItem('sido_data_timestamp');

        if (storedData && storedTimestamp) {
          const timestamp = parseInt(storedTimestamp);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;

          if (now - timestamp < oneHour) {
            console.log('시도 코드 데이터가 최근에 저장되어 있습니다. (1시간 이내)');
            // await fetchAndMatchAddress();
            return;
          }
        }

        const response = await fetch(
          `/api/sido?pageNo=1&numOfRows=1000`
        );

        if (!response.ok) {
          throw new Error('시도 코드 조회 실패');
        }

        const data = (await response.json()) as SidoApiResponse;

        if (data.resultCode && data.resultCode !== '00' && data.resultCode !== '0') {
          console.error('시도 코드 API 오류:', data.resultMsg);
          return;
        }

        if (data.items && data.items.length > 0) {
          localStorage.setItem('sido_data', JSON.stringify(data.items));
          localStorage.setItem('sido_data_timestamp', Date.now().toString());
          console.log('시도 코드 데이터가 localStorage에 저장되었습니다.', data.items.length, '개');

          await fetchAndMatchAddress();
        }
      } catch (err) {
        console.error('시도 코드 조회 오류:', err);
      }
    };

    const fetchAndMatchAddress = async () => {
      try {
        if (!navigator.geolocation) {
          console.log('Geolocation이 지원되지 않습니다.');
          return;
        }

        const storedMatchedAddress = localStorage.getItem('matched_address');
        const matchedAddressTimestamp = localStorage.getItem('matched_address_timestamp');

        if (storedMatchedAddress && matchedAddressTimestamp) {
          const timestamp = parseInt(matchedAddressTimestamp);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;

          if (now - timestamp < oneHour) {
            console.log('매칭된 주소 데이터가 최근에 저장되어 있습니다. (1시간 이내)');
            return;
          }
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const longitude = position.coords.longitude;
            const latitude = position.coords.latitude;

            const location = {
              latitude: latitude,
              longitude: longitude,
            };
            localStorage.setItem('location', JSON.stringify(location));
            localStorage.setItem('location_timestamp', Date.now().toString());

            // 주소 변환
            const response = await fetch(
              `/api/geocode?longitude=${longitude}&latitude=${latitude}`
            );

            if (!response.ok) {
              throw new Error('주소 정보를 가져오는데 실패했습니다.');
            }

            const data = await response.json();

            if (data.response?.status === 'OK' && data.response?.result) {
              const result = data.response.result[0];
              const level1 = result.structure?.level1 || '';

              if (!level1) {
                console.log('level1 정보가 없습니다. 기본값(서울)을 사용합니다.');
                const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
                if (seoulSido) {
                  const defaultAddress: MatchedAddress = {
                    level1: '서울특별시',
                    sidoCd: seoulSido.SIDO_CD,
                    sidoName: seoulSido.SIDO_NAME,
                  };
                  localStorage.setItem('matched_address', JSON.stringify(defaultAddress));
                  localStorage.setItem('matched_address_timestamp', Date.now().toString());
                  document.cookie = `matched_address=${encodeURIComponent(JSON.stringify(defaultAddress))}; path=/; max-age=${60 * 60 * 24 * 7}`;
                  console.log('기본값(서울) 주소 정보 저장:', defaultAddress);
                }
                return;
              }

              const storedSidoData = localStorage.getItem('sido_data');
              if (!storedSidoData) {
                console.log('sido_data가 localStorage에 없습니다. 기본값(서울)을 사용합니다.');
                const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
                if (seoulSido) {
                  const defaultAddress: MatchedAddress = {
                    level1: level1 || '서울특별시',
                    sidoCd: seoulSido.SIDO_CD,
                    sidoName: seoulSido.SIDO_NAME,
                  };
                  localStorage.setItem('matched_address', JSON.stringify(defaultAddress));
                  localStorage.setItem('matched_address_timestamp', Date.now().toString());
                  document.cookie = `matched_address=${encodeURIComponent(JSON.stringify(defaultAddress))}; path=/; max-age=${60 * 60 * 24 * 7}`;
                  console.log('기본값(서울) 주소 정보 저장:', defaultAddress);
                }
                return;
              }

              try {
                const sidoData: SidoItem[] = JSON.parse(storedSidoData);

                const matchedSido = sidoData.find((item) => {
                  const sidoName = item.SIDO_NAME.trim();
                  const level1Trimmed = level1.trim();

                  return (
                    sidoName === level1Trimmed ||
                    level1Trimmed.includes(sidoName) ||
                    sidoName.includes(level1Trimmed)
                  );
                });

                if (matchedSido) {
                  const matchedAddress: MatchedAddress = {
                    level1: level1,
                    sidoCd: matchedSido.SIDO_CD,
                    sidoName: matchedSido.SIDO_NAME,
                  };
                  localStorage.setItem('matched_address', JSON.stringify(matchedAddress));
                  localStorage.setItem('matched_address_timestamp', Date.now().toString());
                  // 쿠키에도 저장 (Server Component에서 접근 가능하도록)
                  document.cookie = `matched_address=${encodeURIComponent(JSON.stringify(matchedAddress))}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7일
                  console.log('주소 매칭 성공 및 localStorage 저장:', matchedAddress);
                } else {
                  console.log('시도 코드 매칭 실패. level1:', level1, '기본값(서울)을 사용합니다.');
                  const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
                  if (seoulSido) {
                    const defaultAddress: MatchedAddress = {
                      level1: level1,
                      sidoCd: seoulSido.SIDO_CD,
                      sidoName: seoulSido.SIDO_NAME,
                    };
                    localStorage.setItem('matched_address', JSON.stringify(defaultAddress));
                    localStorage.setItem('matched_address_timestamp', Date.now().toString());
                    document.cookie = `matched_address=${encodeURIComponent(JSON.stringify(defaultAddress))}; path=/; max-age=${60 * 60 * 24 * 7}`;
                    console.log('기본값(서울) 주소 정보 저장:', defaultAddress);
                  }
                }
              } catch (parseError) {
                console.error('sido_data 파싱 오류:', parseError);
              }
            }
          },
          (error) => {
            console.log('위치 정보를 가져올 수 없습니다:', error.message, '기본값(서울)을 사용합니다.');
            const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
            if (seoulSido) {
              const defaultAddress: MatchedAddress = {
                level1: '서울특별시',
                sidoCd: seoulSido.SIDO_CD,
                sidoName: seoulSido.SIDO_NAME,
              };
              localStorage.setItem('matched_address', JSON.stringify(defaultAddress));
              localStorage.setItem('matched_address_timestamp', Date.now().toString());
              document.cookie = `matched_address=${encodeURIComponent(JSON.stringify(defaultAddress))}; path=/; max-age=${60 * 60 * 24 * 7}`;
              console.log('기본값(서울) 주소 정보 저장:', defaultAddress);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } catch (err) {
        console.error('주소 매칭 오류:', err, '기본값(서울)을 사용합니다.');
        const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
        if (seoulSido) {
          const defaultAddress: MatchedAddress = {
            level1: '서울특별시',
            sidoCd: seoulSido.SIDO_CD,
            sidoName: seoulSido.SIDO_NAME,
          };
          localStorage.setItem('matched_address', JSON.stringify(defaultAddress));
          localStorage.setItem('matched_address_timestamp', Date.now().toString());
          document.cookie = `matched_address=${encodeURIComponent(JSON.stringify(defaultAddress))}; path=/; max-age=${60 * 60 * 24 * 7}`;
          console.log('기본값(서울) 주소 정보 저장:', defaultAddress);
        }
      }
    };

    fetchAndStoreSidoData();
  }, []);

  return null;
}
