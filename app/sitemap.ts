import { MetadataRoute } from 'next';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_ENV === 'production'
    ? 'https://www.kkosunnae.com'
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.kkosunnae.com');

function getDateFromTimestamp(timestamp: unknown): Date {
  if (!timestamp) return new Date();

  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'seconds' in timestamp
  ) {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }

  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'toDate' in timestamp &&
    typeof (timestamp as { toDate: () => Date }).toDate === 'function'
  ) {
    return (timestamp as { toDate: () => Date }).toDate();
  }

  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    Object.prototype.toString.call(timestamp) === '[object Date]'
  ) {
    return timestamp as Date;
  }

  return new Date();
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
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shelter`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/animalShelter`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search-animal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [{ data: posts, error: postsError }, { data: users, error: usersError }] =
      await Promise.all([
        supabaseAdmin
          .from('posts')
          .select('id, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabaseAdmin
          .from('users')
          .select('id, created_at')
          .limit(1000),
      ]);

    if (postsError) {
      throw new Error(postsError.message);
    }

    if (usersError) {
      throw new Error(usersError.message);
    }

    const postPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => {
      const lastModified = post.updated_at
        ? getDateFromTimestamp(post.updated_at)
        : post.created_at
          ? getDateFromTimestamp(post.created_at)
          : new Date();

      return {
        url: `${baseUrl}/read/${post.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    const userPages: MetadataRoute.Sitemap = (users ?? []).map((user) => {
      const lastModified = user.created_at
        ? getDateFromTimestamp(user.created_at)
        : new Date();

      return {
        url: `${baseUrl}/posts/${user.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
      };
    });

    dynamicPages = [...postPages, ...userPages];
  } catch (error) {
    console.error('동적 sitemap 생성 중 오류:', error);
  }

  return [...staticPages, ...dynamicPages];
}
