import { MetadataRoute } from 'next';
import { getCachedAllShelterAnimals } from '@/lib/server/cached-shelter';
import { isShelterAnimalListable } from '@/lib/client/shelter';

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_ENV === 'production'
    ? 'https://www.kkosunnae.com'
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.kkosunnae.com');

export const revalidate = 600;

function sitemapDate(value: string | undefined): Date | undefined {
  const digits = value?.replace(/\D/g, '').slice(0, 8);
  if (!digits || digits.length !== 8) return undefined;
  const date = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T00:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const animals = await getCachedAllShelterAnimals().catch(() => []);
  const detailPages: MetadataRoute.Sitemap = animals
    .filter((animal) => animal.desertionNo && isShelterAnimalListable(animal.processState))
    .map((animal) => ({
      url: `${baseUrl}/${encodeURIComponent(animal.desertionNo!)}`,
      lastModified: sitemapDate(animal.updTm || animal.noticeSdt || animal.happenDt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...detailPages];
}
