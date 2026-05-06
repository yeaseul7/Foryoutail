import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fetchShelterInfoByCareRegNo } from '@/lib/client/shelter-info';
import {
  generateMetadata as buildMetadata,
  getBaseUrl,
} from '@/packages/utils/metadata';

interface AnimalShelterDetailLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

function getFallbackMetadata(url: string): Metadata {
  return buildMetadata({
    title: '보호소 상세 정보',
    description: '보호소 운영 정보와 보호 중인 아이들을 포유테일에서 확인해보세요.',
    url,
    imageAlt: '포유테일 보호소 상세',
  });
}

export async function generateMetadata({
  params,
}: AnimalShelterDetailLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const careRegNo = (id ?? '').trim();
  const baseUrl = getBaseUrl();
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/animalShelter/${careRegNo}`;

  if (!careRegNo) {
    return getFallbackMetadata(url);
  }

  try {
    const shelter = await fetchShelterInfoByCareRegNo(careRegNo, {
      baseUrl: normalizedBaseUrl,
      cache: 'force-cache',
    });
    const shelterName = shelter?.careNm?.trim() || '보호소';
    const region = shelter?.orgNm?.trim() || shelter?.careAddr?.trim() || '전국';

    return buildMetadata({
      title: `${shelterName} 보호소 정보`,
      description: `${region} ${shelterName}의 운영 정보와 보호 중인 아이들을 포유테일에서 확인해보세요.`,
      url,
      imageAlt: `${shelterName} 보호소 정보`,
    });
  } catch {
    return getFallbackMetadata(url);
  }
}

export default function AnimalShelterDetailLayout({
  children,
}: AnimalShelterDetailLayoutProps) {
  return children;
}
