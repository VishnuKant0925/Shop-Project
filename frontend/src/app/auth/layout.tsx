import type { Metadata } from 'next';

// Private, per-user pages: keep them out of search results.
export const metadata: Metadata = {
  title: 'Login',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
