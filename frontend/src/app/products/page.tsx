'use client';

import React, { useState } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import styles from './page.module.css';

export default function ProductsPage() {
  const { products, categories, isLoading, error, refreshCatalog } = useProductCatalog();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high'>('default');

  let filtered = products.filter((p) => p.isActive);

  if (selectedCategory !== 'all') {
    filtered = filtered.filter((p) => p.categoryId === selectedCategory);
  }

  if (searchQuery) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  }

  return (
    <div className={styles.page}>
      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroBadge}>Our Collection</span>
          <h1 className={styles.heroTitle}>Premium Products</h1>
          <p className={styles.heroSubtitle}>
            Handcrafted spices and pure oils — taste the tradition.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className={`${styles.filtersSection} container`}>
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.categoryFilter}>
              <button
                className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.categoryBtnActive : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.categoryBtnActive : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'price-low' | 'price-high')}
              className={styles.sortSelect}
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className={`${styles.productsSection} container`}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <h3>Loading products...</h3>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <h3>Could not load products</h3>
            <p>{error}</p>
            <button className={styles.categoryBtn} onClick={() => void refreshCatalog()}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <h3>No products found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
