import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Work_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProductCatalogProvider } from '@/context/ProductCatalogContext';
import { SettingsProvider } from '@/context/SettingsContext';
import AppShell from '@/components/layout/AppShell';
import { absoluteUrl, siteConfig } from '@/lib/site';

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-work-sans',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Only the glyphs actually used are downloaded (the full icon font is several MB).
// Add a name here when you use a new icon. Google requires the list sorted.
const ICONS = [
  'account_circle', 'add', 'admin_panel_settings', 'arrow_back', 'arrow_forward', 'calendar_month',
  'call', 'chat', 'check', 'close', 'dark_mode', 'delete', 'description', 'expand_more', 'fact_check',
  'filter_vintage', 'grain', 'handyman', 'health_and_safety', 'home', 'light_mode', 'local_fire_department',
  'location_on', 'lock', 'logout', 'mail', 'notifications', 'oil_barrel', 'person', 'phone',
  'receipt_long', 'remove', 'scale', 'schedule', 'science', 'search', 'settings', 'shopping_basket',
  'spa', 'star', 'storefront', 'verified', 'verified_user', 'water_drop',
].sort();
const ICON_FONT_URL = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICONS.join(',')}&display=block`;

// Runs before first paint so the saved / system theme applies without a flash.
const themeScript = `(function(){try{var t=location.pathname.indexOf('/admin')===0?'light':localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'New Pandit Masala & Tel Mill — Pure Kachi Ghani Mustard Oil & Stone-Ground Spices',
    template: '%s | New Pandit Masala & Tel Mill',
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  keywords: [
    'kachi ghani mustard oil', 'cold pressed mustard oil', 'sarson tel', 'turmeric powder', 'haldi',
    'red chilli powder', 'coriander powder', 'atta chakki', 'oil mill Lalganj', 'masala mill Vaishali',
    'poha milling', 'FSSAI certified spices', 'Bihar',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'New Pandit Masala & Tel Mill — Pure Cold-Pressed Oil & Stone-Ground Spices',
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, alt: 'New Pandit Masala & Tel Mill' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New Pandit Masala & Tel Mill',
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  formatDetection: { telephone: true },
  appleWebApp: { capable: true, title: siteConfig.shortName, statusBarStyle: 'default' },
  category: 'shopping',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfbf9' },
    { media: '(prefers-color-scheme: dark)', color: '#12100e' },
  ],
};

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  '@id': absoluteUrl('/#store'),
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  logo: absoluteUrl('/images/logo.jpeg'),
  image: absoluteUrl(siteConfig.ogImage),
  telephone: siteConfig.phones[0],
  email: siteConfig.email,
  priceRange: '₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.locality,
    addressRegion: siteConfig.address.region,
    postalCode: siteConfig.address.postalCode,
    addressCountry: siteConfig.address.country,
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: siteConfig.hours.opens,
    closes: siteConfig.hours.closes,
  }],
  sameAs: [siteConfig.whatsapp],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${workSans.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={ICON_FONT_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <SettingsProvider>
            <ProductCatalogProvider>
              <CartProvider>
                <AppShell>
                  {children}
                </AppShell>
              </CartProvider>
            </ProductCatalogProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
