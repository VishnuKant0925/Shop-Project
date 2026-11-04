import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Kachi Ghani Mustard Oil, Turmeric & Chilli Powder Online',
  description:
    'Order pure cold-pressed mustard oil and stone-ground turmeric, red chilli and coriander powder direct from New Pandit Mill, Lalganj. Pay by UPI, pick up fresh.',
  alternates: { canonical: '/products' },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
