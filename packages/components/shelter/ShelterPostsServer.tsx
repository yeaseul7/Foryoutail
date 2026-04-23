import ShelterPostsClient from './ShelterPostsClient';
import { ShelterAnimalItem } from '@/packages/type/postType';

const API_BASE_URL = 'https://apis.data.go.kr/1543061/abandonmentPublicService_v2';

async function fetchInitialShelterData(): Promise<{
  items: ShelterAnimalItem[];
  hasMore: boolean;
}> {
  try {
    const serviceKey = process.env.NEXT_PUBLIC_ANIMALS_OPENAPI;

    if (!serviceKey) {
      console.error('API key is not configured');
      return { items: [], hasMore: false };
    }

    const urlParams = new URLSearchParams();
    urlParams.append('serviceKey', serviceKey);
    urlParams.append('pageNo', '1');
    urlParams.append('numOfRows', '100');
    urlParams.append('upkind', '417000');
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

      return { items: [], hasMore: false };
    }

    const shelterAnimalResponse = await response.json();

    if (
      shelterAnimalResponse?.response?.header?.resultCode &&
      shelterAnimalResponse.response.header.resultCode !== '00' &&
      shelterAnimalResponse.response.header.resultCode !== '0'
    ) {
      console.error('API returned error:', shelterAnimalResponse.response.header);
      return { items: [], hasMore: false };
    }

    const items = shelterAnimalResponse?.response?.body?.items?.item;
    const itemsArray = items ? (Array.isArray(items) ? items : [items]) : [];
    const hasMore = itemsArray.length === 100;

    return {
      items: itemsArray as ShelterAnimalItem[],
      hasMore,
    };
  } catch (error) {
    console.error('Shelter data fetch error:', error);
    return { items: [], hasMore: false };
  }
}

export default async function ShelterPostsServer() {
  const initialData = await fetchInitialShelterData();
  return <ShelterPostsClient initialData={initialData} />;
}
