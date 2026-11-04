/** Escape user input before using it inside a RegExp (prevents regex injection / ReDoS). */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive "contains" matcher for a search box value, capped in length. */
export const searchRegex = (value: unknown): RegExp | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 100);
  return trimmed ? new RegExp(escapeRegex(trimmed), 'i') : null;
};

/** Copy only whitelisted keys that are present on the body (mass-assignment guard). */
export const pick = <T extends Record<string, unknown>>(body: T, keys: readonly string[]): Partial<T> => {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (body && Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  }
  return out as Partial<T>;
};

export const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const parsePagination = (query: Record<string, unknown>, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(String(query.page ?? ''), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit ?? ''), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const PAID_STATUSES = ['paid', 'preparing', 'ready', 'completed'] as const;
