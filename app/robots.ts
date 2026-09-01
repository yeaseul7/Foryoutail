import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/packages/utils/metadata';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
