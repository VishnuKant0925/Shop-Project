import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem', display: 'grid', gap: '0.75rem', justifyItems: 'center' }}>
      <span style={{ fontSize: '3rem' }} aria-hidden="true">🌾</span>
      <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>Page not found</h1>
      <p style={{ color: 'var(--color-on-surface-variant)', maxWidth: '28rem' }}>
        The page you are looking for has moved or no longer exists.
      </p>
      <Link
        href="/products"
        style={{
          marginTop: '0.5rem',
          padding: '0.875rem 1.75rem',
          borderRadius: '9999px',
          background: 'var(--gradient-primary)',
          color: '#fff',
          fontWeight: 700,
        }}
      >
        Browse the store
      </Link>
    </div>
  );
}
