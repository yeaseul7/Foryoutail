import { supabase } from '@/lib/supabase/client';

interface ShelterFavoriteRow {
  shelter_id?: string | null;
}

export async function fetchShelterFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('shelter_favorites')
    .select('shelter_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row: ShelterFavoriteRow) =>
      typeof row.shelter_id === 'string' ? row.shelter_id.trim() : '',
    )
    .filter(Boolean);
}

export async function addShelterFavorite(
  shelterId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('shelter_favorites').insert({
    user_id: userId,
    shelter_id: shelterId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeShelterFavorite(
  shelterId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('shelter_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('shelter_id', shelterId);

  if (error) {
    throw new Error(error.message);
  }
}
