import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Visit, Call or WhatsApp the Mill',
  description:
    'Visit New Pandit Masala & Tel Mill at Vaishali Bus Stand Road, Lalganj, Bihar 844121. Call +91 99347 87476 or request a callback for live oil and milling rates.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
