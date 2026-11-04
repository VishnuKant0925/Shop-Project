import type { Metadata } from 'next';

// Private, per-user pages: keep them out of search results.
export const metadata: Metadata = {
  title: 'My Orders',
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
