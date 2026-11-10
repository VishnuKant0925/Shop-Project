'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import styles from '../page.module.css';

/** "Shop by category" circles, the quick-entry row used by Flipkart / Myntra style stores. */
export default function CategoryTiles() {
  const { categories } = useProductCatalog();

  return (
    <section className={styles.section} aria-labelledby="categories-heading">
      <div className={styles.sectionHeader}>
        <h2 id="categories-heading" className={styles.sectionTitle}>Shop by category</h2>
      </div>
      <div className={styles.categories}>
        {categories.slice(0, 6).map((c) => (
          <Link key={c.id} href={`/products?category=${encodeURIComponent(c.slug)}`} className={styles.categoryTile}>
            <span className={styles.categoryImage}>
              <Image src={c.imageUrl || '/images/red-chili-powder.jpg'} alt="" fill sizes="112px" />
            </span>
            {c.name}
          </Link>
        ))}
        <Link href="/services" className={styles.categoryTile}>
          <span className={`${styles.categoryImage} ${styles.categoryIcon}`}>
            <span className="material-symbols-outlined" aria-hidden="true">settings</span>
          </span>
          Milling
        </Link>
        <Link href="/products" className={styles.categoryTile}>
          <span className={`${styles.categoryImage} ${styles.categoryIcon}`}>
            <span className="material-symbols-outlined" aria-hidden="true">storefront</span>
          </span>
          All products
        </Link>
      </div>
    </section>
  );
}
