import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { getCachedShelterInfo } from '@/lib/server/cached-shelter-info';
import { generateMetadata as buildMetadata, getBaseUrl } from '@/packages/utils/metadata';
import { createShelterSlug, shelterCareRegNoFromSlug } from '@/lib/shelter/shelterSlug';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const careRegNo = shelterCareRegNoFromSlug(id);
  const shelter = await getCachedShelterInfo(careRegNo).catch(() => null);
  const name = shelter?.careNm || '동물보호소';
  const address = shelter?.careAddr || shelter?.jibunAddr || '';
  const description = address
    ? `${name}의 주소, 운영시간, 연락처와 현재 입양 가능한 동물 공고를 findme에서 확인해보세요.`
    : `${name}의 운영정보와 현재 입양 가능한 동물 공고를 findme에서 확인해보세요.`;
  const url = `${getBaseUrl().replace(/\/$/, '')}/shelters/${encodeURIComponent(createShelterSlug(shelter?.careNm, careRegNo))}`;

  return buildMetadata({
    title: `${name} 보호소 정보`,
    description,
    url,
    defaultImagePath: '/static/images/shelter-og.png',
    imageAlt: `${name} 보호소 정보`,
    type: 'website',
  });
}

export default function ShelterLayout({ children }: { children: ReactNode }) {
  return children;
}
