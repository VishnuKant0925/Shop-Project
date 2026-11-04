import type { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/cart', '/checkout', '/orders', '/profile', '/auth'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  };
}
