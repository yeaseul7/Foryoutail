import ShelterDetailPageContent from './ShelterDetailPageContent';
import { notFound } from 'next/navigation';
import { getCachedShelterAnimal } from '@/lib/server/cached-shelter';
import { getCachedShelterInfo } from '@/lib/server/cached-shelter-info';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

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
  let protectedAnimalCount = 0;
  if (animal.careRegNo) {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { count } = await supabaseAdmin
      .from('animals')
      .select('id', { count: 'exact', head: true })
      .eq('care_reg_no', animal.careRegNo)
      .eq('process_state', 'protect');
    protectedAnimalCount = count ?? 0;
  }

  return <ShelterDetailPageContent animalData={animal} shelterInfo={shelterInfo} protectedAnimalCount={protectedAnimalCount} />;
}
