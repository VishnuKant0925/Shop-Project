'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/data';
import { useCart } from '@/context/CartContext';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/types';
import styles from './page.module.css';

const features = [
  { icon: 'verified', label: '100% pure' },
  { icon: 'science', label: 'Lab tested' },
  { icon: 'storefront', label: 'Pickup at mill' },
];

const LONG_DESCRIPTION = 180;

interface ProductDetailProps {
  slug: string;
  initialProduct: Product | null;
}

export default function ProductDetail({ slug, initialProduct }: ProductDetailProps) {
  const { products, isLoading, error } = useProductCatalog();
  // Prefer the live catalogue (real-time stock/price); fall back to the server-rendered copy.
  const product = products.find((p) => p.slug === slug) ?? initialProduct;
  const { addItem, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!product) {
    return (
      <div className={styles.notFound}>
        {isLoading ? (
          <div className={styles.loadingBox}>
            <div className={`${styles.loadingImage} skeleton`} />
            <div className={`${styles.loadingLine} skeleton`} />
            <div className={`${styles.loadingLine} ${styles.loadingLineShort} skeleton`} />
          </div>
        ) : (
          <>
            <span className={styles.notFoundIcon} aria-hidden="true">🔍</span>
            <h1>{error ? 'Could not load this product' : 'Product not found'}</h1>
            {error && <p>{error}</p>}
            <Link href="/products" className={styles.notFoundLink}>← Back to Store</Link>
          </>
        )}
      </div>
    );
  }

  const cartQty = getItemQuantity(product.id);
  const outOfStock = product.stockQuantity <= 0;
  const relatedProducts = products.filter((p) => p.id !== product.id && p.isActive).slice(0, 4);

  const handleAdd = () => {
    addItem(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/products">Store</Link>
          <span aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">{product.name}</span>
        </nav>

        <div className={styles.detail}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              {product.badge && <span className={styles.badge}>{product.badge}</span>}
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.image}
                priority
              />
            </div>
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>{formatCurrency(product.price)}</span>
              <span className={styles.unit}>per {product.unit}</span>
              <span className={styles.taxNote}>+ 5% GST</span>
            </div>

            <div className={`${styles.stockBadge} ${outOfStock ? styles.stockOut : ''}`}>
              <span className={styles.stockDot} />
              {outOfStock ? 'Out of stock' : `In stock · ${product.stockQuantity} ${product.unit} available`}
            </div>

            <p className={`${styles.description} ${!showFullDescription && product.description.length > LONG_DESCRIPTION ? styles.descriptionClamped : ''}`}>
              {product.description}
            </p>
            {product.description.length > LONG_DESCRIPTION && (
              <button type="button" className={styles.readMore} onClick={() => setShowFullDescription((v) => !v)}>
                {showFullDescription ? 'Show less' : 'Read more'}
              </button>
            )}

            {/* Quantity & Add to Cart (becomes a sticky bar on phones) */}
            <div className={styles.addSection}>
              <div className={styles.quantityControl} role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.qtyBtn}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">remove</span>
                </button>
                <span className={styles.qtyValue} aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.qtyBtn}
                  aria-label="Increase quantity"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">add</span>
                </button>
              </div>

              <button
                type="button"
                className={`${styles.addToCartBtn} ${justAdded ? styles.addToCartBtnDone : ''}`}
                onClick={handleAdd}
                disabled={outOfStock}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {justAdded ? 'check' : 'shopping_basket'}
                </span>
                {outOfStock
                  ? 'Out of stock'
                  : justAdded
                    ? 'Added!'
                    : `Add · ${formatCurrency(product.price * quantity)}`}
              </button>
            </div>

            {cartQty > 0 && (
              <Link href="/cart" className={styles.goToCart}>
                <span>{cartQty} in your cart</span>
                <span className={styles.goToCartAction}>
                  View cart
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </span>
              </Link>
            )}

            <ul className={styles.features}>
              {features.map((f) => (
                <li key={f.label} className={styles.featureItem}>
                  <span className="material-symbols-outlined" aria-hidden="true">{f.icon}</span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection} aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.relatedTitle}>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
