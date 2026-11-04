import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/serverApi';
import { absoluteUrl, siteConfig } from '@/lib/site';
import ProductDetail from './ProductDetail';

type Props = { params: Promise<{ slug: string }> };

const toAbsolute = (url: string) => (url.startsWith('http') ? url : absoluteUrl(url));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const path = `/products/${slug}`;

  if (!product) {
    return { title: { absolute: `Product | ${siteConfig.name}` }, alternates: { canonical: path } };
  }

  const description = product.description.length > 160
    ? `${product.description.slice(0, 157).trimEnd()}…`
    : product.description;

  return {
    // Absolute: the /products layout's string title stops the root template from applying here.
    title: { absolute: `${product.name} — Buy Online | ${siteConfig.name}` },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      title: `${product.name} | ${siteConfig.shortName}`,
      description,
      images: [{ url: toAbsolute(product.imageUrl), alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [toAbsolute(product.imageUrl)],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (product === null) notFound();

  const jsonLd = product && [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: [toAbsolute(product.imageUrl)],
      sku: product.id,
      brand: { '@type': 'Brand', name: siteConfig.shortName },
      offers: {
        '@type': 'Offer',
        url: absoluteUrl(`/products/${product.slug}`),
        priceCurrency: 'INR',
        price: product.price,
        availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': absoluteUrl('/#store') },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Store', item: absoluteUrl('/products') },
        { '@type': 'ListItem', position: 3, name: product.name, item: absoluteUrl(`/products/${product.slug}`) },
      ],
    },
  ];

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetail slug={slug} initialProduct={product ?? null} />
    </>
  );
}
