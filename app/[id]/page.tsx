import ShelterDetailPageContent from './ShelterDetailPageContent';
import { notFound } from 'next/navigation';
import { getCachedShelterAnimal } from '@/lib/server/cached-shelter';
import { getCachedShelterInfo } from '@/lib/server/cached-shelter-info';

export const revalidate = 600;

export default async function ShelterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animal = await getCachedShelterAnimal(id);
  if (!animal) notFound();

  const shelterInfo = animal.careRegNo
    ? await getCachedShelterInfo(animal.careRegNo).catch(() => null)
    : null;

  return <ShelterDetailPageContent animalData={animal} shelterInfo={shelterInfo} />;
}
