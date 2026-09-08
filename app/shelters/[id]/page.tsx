import { notFound, permanentRedirect } from 'next/navigation';

import { getCachedShelterInfo } from '@/lib/server/cached-shelter-info';
import { queryShelterAnimals } from '@/lib/domain/shelter/shelter-animals';
import ShelterPageContent from './ShelterPageContent';
import { getBaseUrl } from '@/packages/utils/metadata';
import { createShelterSlug, shelterCareRegNoFromSlug } from '@/lib/shelter/shelterSlug';

export const revalidate = 600;

export default async function ShelterPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(Number.parseInt(resolvedSearchParams.page || '1', 10) || 1, 1);
  const careRegNo = shelterCareRegNoFromSlug(id);
  const shelter = await getCachedShelterInfo(careRegNo).catch(() => null);
  if (!shelter) notFound();
  const canonicalSlug = createShelterSlug(shelter.careNm, careRegNo);
  if (decodeURIComponent(id) !== canonicalSlug) permanentRedirect(`/shelters/${canonicalSlug}`);

  const [animals, noticeAnimals, protectedAnimals] = await Promise.all([
    queryShelterAnimals({ care_reg_no: careRegNo, pageNo: String(page), numOfRows: '20' }),
    queryShelterAnimals({ care_reg_no: careRegNo, state: 'notice', pageNo: '1', numOfRows: '1' }),
    queryShelterAnimals({ care_reg_no: careRegNo, state: 'protect', pageNo: '1', numOfRows: '1' }),
  ]);
  const address = shelter.careAddr || shelter.jibunAddr;
  const pageUrl = `${getBaseUrl().replace(/\/$/, '')}/shelters/${encodeURIComponent(canonicalSlug)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AnimalShelter',
    '@id': pageUrl,
    url: pageUrl,
    name: shelter.careNm || '동물보호소',
    telephone: shelter.careTel || undefined,
    address: address ? { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'KR' } : undefined,
    geo: typeof shelter.lat === 'number' && typeof shelter.lng === 'number'
      ? { '@type': 'GeoCoordinates', latitude: shelter.lat, longitude: shelter.lng }
      : undefined,
    openingHours: shelter.weekOprStime && shelter.weekOprEtime
      ? `Mo-Fr ${shelter.weekOprStime}-${shelter.weekOprEtime}`
      : undefined,
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <ShelterPageContent shelter={shelter} noticeAnimalCount={noticeAnimals.totalCount} protectedAnimalCount={protectedAnimals.totalCount} animals={animals.items} currentPage={page} totalPages={Math.max(1, Math.ceil(animals.totalCount / 20))} />
  </>;
}
