export const defaultAllowedOrigins = [
  'https://newpanditmasala.shop',
  'https://www.newpanditmasala.shop',
  'http://newpanditmasala.shop',
  'http://www.newpanditmasala.shop',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Validates whether an incoming HTTP or WebSocket origin is permitted.
 */
export const isOriginAllowed = (origin?: string): boolean => {
  // Allow requests without Origin header (curl, Postman, mobile apps, server-to-server)
  if (!origin) return true;

  const rawOrigins = process.env.CLIENT_URL || '';
  const envOrigins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedSet = new Set([...defaultAllowedOrigins, ...envOrigins]);
  if (allowedSet.has(origin)) return true;

  // Matches newpanditmasala.shop and any subdomains (e.g. www.newpanditmasala.shop)
  if (/^https?:\/\/([a-z0-9-]+\.)*newpanditmasala\.shop(:\d+)?$/i.test(origin)) {
    return true;
  }

  // Matches Vercel production and preview deployment URLs
  if (/^https?:\/\/([a-z0-9-]+\.)*vercel\.app(:\d+)?$/i.test(origin)) {
    return true;
  }

  return false;
};

/**
 * Delegate callback for Express cors middleware.
 */
export const corsOriginDelegate = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};
