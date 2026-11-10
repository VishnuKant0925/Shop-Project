'use client';

import React, { Suspense, useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import styles from './page.module.css';

type SortOption = 'default' | 'price-low' | 'price-high';

// useSearchParams needs a Suspense boundary so the page can still be prerendered.
export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <Store />
    </Suspense>
  );
}

function Store() {
  const { products, categories, isLoading, error, refreshCatalog } = useProductCatalog();
  // Home page category tiles link here as /products?category=<slug>
  const urlCategory = useSearchParams().get('category');
  const [pickedCategory, setSelectedCategory] = useState<string | null>(null);
  const selectedCategory = pickedCategory ?? categories.find((c) => c.slug === urlCategory)?.id ?? 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const deferredQuery = useDeferredValue(searchQuery);

  const filtered = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();
    const result = products.filter((p) =>
      p.isActive &&
      (selectedCategory === 'all' || p.categoryId === selectedCategory) &&
      (!query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
    );
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, selectedCategory, deferredQuery, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className={styles.page}>
      <h1 className={`${styles.heroTitle} container`}>Shop</h1>

      {/* Filters (sticky under the header) */}
      <div className={styles.filtersBar}>
        <div className={`${styles.filters} container`}>
          <div className={styles.searchRow}>
            <label className={styles.searchBox}>
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <span className="sr-only">Search products</span>
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Search oil, haldi, mirch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button type="button" className={styles.clearSearch} onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              )}
            </label>

            <label className={styles.sortWrap}>
              <span className="sr-only">Sort products</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={styles.sortSelect}
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
              </select>
            </label>
          </div>

          <div className={styles.categoryFilter} role="tablist" aria-label="Filter by category">
            {[{ id: 'all', name: 'All' }, ...categories].map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.categoryBtnActive : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section className={`${styles.productsSection} container`} aria-label="Products">
        {isLoading ? (
          <div className={styles.productGrid} aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={`${styles.skeletonCard} skeleton`} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">⚠️</span>
            <h2>Could not load products</h2>
            <p>{error}</p>
            <button type="button" className={styles.emptyAction} onClick={() => void refreshCatalog()}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">🔍</span>
            <h2>No products found</h2>
            <p>Try a different search or category.</p>
            <button type="button" className={styles.emptyAction} onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className={styles.resultCount} aria-live="polite">
              {filtered.length} product{filtered.length === 1 ? '' : 's'}
            </p>
            <div className={styles.productGrid}>
              {filtered.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
