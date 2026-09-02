import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'New Pandit Masala & Tel Mill — Premium Spices & Milling Services',
  description:
    'Shop premium quality Red Chili Powder, Turmeric Powder, Coriander Powder, and pure cold-pressed Mustard Oil. We also offer Mustard Oil Milling, Flour Milling, and Poha Milling services.',
  keywords: 'masala, spices, chili powder, turmeric, mustard oil, flour milling, poha milling, Indian spices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
