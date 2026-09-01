import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getCachedShelterAnimal } from '@/lib/server/cached-shelter';
import {
  generateMetadata as buildMetadata,
  getBaseUrl,
} from '@/packages/utils/metadata';

interface ShelterDetailLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

function getFallbackMetadata(url: string): Metadata {
  return buildMetadata({
    title: '유기동물 공고 상세',
    description: '유기동물 공고 상세 정보와 보호소 정보를 꼬순내에서 확인해보세요.',
    url,
    imageAlt: '꼬순내 유기동물 공고 상세',
    type: 'article',
  });
}

function buildAnimalDescription(kind: string, orgNm: string, processState: string): string {
  return `${orgNm}에서 ${processState} 상태인 ${kind} 공고를 꼬순내에서 확인하고, 보호소 정보와 입양 관련 내용을 함께 살펴보세요.`;
}

function processStateLabel(value: string | undefined): string {
  if (value === 'notice') return '공고중';
  if (value === 'protect') return '보호중';
  if (value === 'adopted') return '입양 완료';
  if (value === 'returned') return '반환 완료';
  if (value === 'ended') return '종료';
  return '상태 미확인';
}

export async function generateMetadata({
  params,
}: ShelterDetailLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const desertionNo = (id ?? '').trim();
  const baseUrl = getBaseUrl();
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/shelter/${desertionNo}`;

  if (!desertionNo) {
    return getFallbackMetadata(url);
  }

  try {
    const animal = await getCachedShelterAnimal(desertionNo);
    const kind = animal?.kindNm?.trim() || animal?.kindFullNm?.trim() || '유기동물';
    const orgNm = animal?.orgNm?.trim() || animal?.careNm?.trim() || '보호소';
    const processState = processStateLabel(animal?.processState?.trim());
    const imageUrl = animal?.popfile1 || animal?.popfile || null;

    return buildMetadata({
      title: `${kind} 입양 공고`,
      description: buildAnimalDescription(kind, orgNm, processState),
      url,
      imageUrl,
      imageAlt: `${kind} 입양 공고`,
      type: 'article',
    });
  } catch {
    return getFallbackMetadata(url);
  }
}

export default function ShelterDetailLayout({ children }: ShelterDetailLayoutProps) {
  return children;
}
