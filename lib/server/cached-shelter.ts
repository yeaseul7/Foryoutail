import 'server-only';

import { unstable_cache } from 'next/cache';
import {
  getShelterAnimalByDesertionNo,
  loadAllShelterAnimals,
  queryShelterAnimals,
  type ShelterDataQueryParams,
} from '@/lib/domain/shelter/shelter-animals';

const REVALIDATE_SECONDS = 600;

export const getCachedShelterAnimal = unstable_cache(
  async (desertionNo: string) => getShelterAnimalByDesertionNo(desertionNo),
  ['shelter-animal-detail'],
  { revalidate: REVALIDATE_SECONDS, tags: ['shelter-animals'] },
);

export const getCachedShelterAnimals = unstable_cache(
  async (params: ShelterDataQueryParams) => queryShelterAnimals(params),
  ['shelter-animal-list'],
  { revalidate: REVALIDATE_SECONDS, tags: ['shelter-animals'] },
);

export const getCachedAllShelterAnimals = unstable_cache(
  async () => loadAllShelterAnimals(),
  ['shelter-animal-sitemap'],
  { revalidate: REVALIDATE_SECONDS, tags: ['shelter-animals'] },
);
