import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

// Lets phone users "Add to Home Screen" and open the store like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfbf9',
    theme_color: '#b45309',
    lang: 'en-IN',
    categories: ['shopping', 'food'],
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/images/logo.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'any' },
    ],
  };
}
