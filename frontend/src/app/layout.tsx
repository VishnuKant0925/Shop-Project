import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProductCatalogProvider } from '@/context/ProductCatalogContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'New Pandit Masala & Tel Mill — 100% Pure Cold-Pressed & Traditional Chakki',
  description:
    'Shop premium quality cold-pressed Mustard Oil, stone-ground Turmeric, Red Chili, Coriander Powder, and fresh Poha. Custom milling and oil expelling services available. FSSAI certified.',
  keywords: 'masala, spices, chili powder, turmeric, mustard oil, flour milling, poha milling, Indian spices, cold pressed, kachi ghani, FSSAI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ProductCatalogProvider>
            <CartProvider>
              <Navbar />
              <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
                {children}
              </main>
              <Footer />
            </CartProvider>
          </ProductCatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
