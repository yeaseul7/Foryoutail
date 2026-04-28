import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { supabaseRowToShelterAnimal } from '@/lib/domain/shelter/shelter-animals';
import { isShelterAnimalListable } from '@/lib/client/shelter';
import type {
  ShelterAnimalItem,
  ShelterAnimalRow,
} from '@/packages/type/shelterAnimalTypes';

export const runtime = 'edge';

const DEFAULT_LIMIT = 5;

interface TopLikedAnimalRow {
  item: ShelterAnimalItem;
  likedCount: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = Math.max(
      parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      1,
    );

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: likes, error: likesError } = await supabaseAdmin
      .from('animal_likes')
      .select('animal_id')
      .not('animal_id', 'is', null);

    if (likesError) {
      throw new Error(likesError.message);
    }

    const counts = new Map<string, number>();
    for (const row of likes ?? []) {
      const animalId =
        typeof row.animal_id === 'string' ? row.animal_id.trim() : '';
      if (!animalId) continue;
      counts.set(animalId, (counts.get(animalId) ?? 0) + 1);
    }

    const sortedAnimalIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount * 6)
      .map(([animalId]) => animalId);

    if (sortedAnimalIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data: animals, error: animalsError } = await supabaseAdmin
      .from('animals')
      .select('*')
      .in('id', sortedAnimalIds);

    if (animalsError) {
      throw new Error(animalsError.message);
    }

    const animalMap = new Map(
      (animals ?? []).map((row) => [
        row.id,
        supabaseRowToShelterAnimal(row as ShelterAnimalRow),
      ]),
    );

    const items: TopLikedAnimalRow[] = sortedAnimalIds
      .map((animalId) => {
        const item = animalMap.get(animalId);
        if (!item) return null;
        if (!isShelterAnimalListable(item.processState)) return null;
        return {
          item,
          likedCount: counts.get(animalId) ?? 0,
        };
      })
      .filter((row): row is TopLikedAnimalRow => row !== null)
      .slice(0, limitCount);

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '인기 동물 조회 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
