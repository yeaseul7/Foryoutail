import { Suspense } from 'react';
import AbandonedCardSkeleton from '../base/AbandonedCardSkeleton';
import ShelterPostsClient from './ShelterPostsClient';
import { ShelterAnimalItem } from '@/packages/type/postType';

const API_BASE_URL = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2';

async function ShelterPostsContent() {
  try {
    const serviceKey = process.env.NEXT_PUBLIC_ANIMALS_OPENAPI;

    if (!serviceKey) {
      console.error('API key is not configured');
      return <ShelterPostsClient initialData={{ items: [], hasMore: false }} />;
    }

    const urlParams = new URLSearchParams();
    urlParams.append('serviceKey', serviceKey);
    urlParams.append('pageNo', '1');
    urlParams.append('numOfRows', '30');
    urlParams.append('_type', 'json');

    const apiUrl = `${API_BASE_URL}/abandonmentPublic_v2?${urlParams.toString()}`;
    console.log('Fetching from API (serviceKey hidden)');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
      });

      if (response.status === 401) {
        console.error('401 Unauthorized - API key may be invalid or missing');
      }

      return <ShelterPostsClient initialData={{ items: [], hasMore: false }} />;
    }

    const shelterAnimalResponse = await response.json();

    if (shelterAnimalResponse?.response?.header?.resultCode &&
      shelterAnimalResponse.response.header.resultCode !== '00' &&
      shelterAnimalResponse.response.header.resultCode !== '0') {
      console.error('API returned error:', shelterAnimalResponse.response.header);
      return <ShelterPostsClient initialData={{ items: [], hasMore: false }} />;
    }

    const items = shelterAnimalResponse?.response?.body?.items?.item;
    const itemsArray = items ? (Array.isArray(items) ? items : [items]) : [];
    const hasMore = itemsArray.length === 30;

    const initialData = {
      items: itemsArray as ShelterAnimalItem[],
      hasMore,
    };

    return <ShelterPostsClient initialData={initialData} />;
  } catch (error) {
    console.error('Shelter data fetch error:', error);
    // 에러 발생 시 빈 데이터 반환 (fallback)
    return <ShelterPostsClient initialData={{ items: [], hasMore: false }} />;
  }
}

function ShelterPostsSkeleton() {
  return (
    <>
      <div className="h-20 bg-gray-50 animate-pulse mb-4" />
      <div className="grid grid-cols-1 gap-2 pt-8 w-full px-4 sm:px-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
        {Array.from({ length: 12 }).map((_, index) => (
          <AbandonedCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    </>
  );
}

export default function ShelterPostsServer() {
  return (
    <Suspense fallback={<ShelterPostsSkeleton />}>
      <ShelterPostsContent />
    </Suspense>
  );
}
