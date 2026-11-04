import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/serverApi';
import { absoluteUrl } from '@/lib/site';

// Rebuilt at most once an hour so new products show up without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/products'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/services'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
  ];

  const products = await getAllProducts();
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.isActive)
    .map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: [p.imageUrl.startsWith('http') ? p.imageUrl : absoluteUrl(p.imageUrl)],
    }));

  return [...staticRoutes, ...productRoutes];
}
