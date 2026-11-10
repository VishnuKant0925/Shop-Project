'use client';

import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import styles from '../page.module.css';

export default function FeaturedProducts() {
  const { products, isLoading } = useProductCatalog();
  const featured = products.filter((p) => p.isActive).slice(0, 8);

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className={styles.featuredSection} aria-labelledby="featured-heading">
      <div className={styles.featuredHeader}>
        <h2 id="featured-heading" className={styles.featuredTitle}>Bestsellers</h2>
        <Link href="/products" className={styles.featuredAll}>
          View all
          <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
      <div className={styles.featuredRail}>
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${styles.featuredSkeleton} skeleton`} aria-hidden="true" />
            ))
          : featured.map((product, idx) => (
              <div key={product.id} className={styles.featuredItem}>
                <ProductCard product={product} index={idx} />
              </div>
            ))}
      </div>
    </section>
  );
}
