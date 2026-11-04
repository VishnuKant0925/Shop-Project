import { cache } from 'react';
import { Product, Service } from '@/types';
import { ApiProduct, normaliseProduct } from './api';

// Server-side reads for metadata, structured data and the sitemap.
// Cached for 5 minutes and time-boxed so a cold API never blocks rendering for long.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.newpanditmasala.shop/api';
const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 5000;

type Result<T> = { ok: true; data: T } | { ok: false; status: number | null };

async function getJson<T>(endpoint: string): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: null };
  }
}

/**
 * `null` = the API says the product does not exist (render a 404).
 * `undefined` = the API could not be reached; let the client try again.
 */
export const getProductBySlug = cache(async (slug: string): Promise<Product | null | undefined> => {
  const res = await getJson<{ data?: ApiProduct }>(`/products/${encodeURIComponent(slug)}`);
  if (res.ok) return res.data.data ? normaliseProduct(res.data.data) : null;
  return res.status === 404 ? null : undefined;
});

export const getAllProducts = cache(async (): Promise<Product[]> => {
  const res = await getJson<{ data?: ApiProduct[] }>('/products');
  return res.ok && res.data.data ? res.data.data.map(normaliseProduct) : [];
});

export const getActiveServices = cache(async (): Promise<Service[]> => {
  const res = await getJson<{ data?: Service[] }>('/services');
  return res.ok && Array.isArray(res.data.data) ? res.data.data : [];
});
