'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { products, formatCurrency } from '@/data';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/products/ProductCard';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = products.find((p) => p.slug === slug);
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>Product not found</h2>
        <Link href="/products">← Back to Products</Link>
      </div>
    );
  }

  const cartQty = getItemQuantity(product.id);
  const relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* Product Detail */}
        <div className={styles.detail}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              {product.badge && (
                <span className={styles.badge}>{product.badge}</span>
              )}
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={600}
                height={600}
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
            </div>

            <div className={styles.stockBadge}>
              <span className={styles.stockDot} />
              In Stock ({product.stockQuantity} {product.unit} available)
            </div>

            <p className={styles.description}>{product.description}</p>

            {/* Quantity & Add to Cart */}
            <div className={styles.addSection}>
              <div className={styles.quantityControl}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.qtyBtn}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>

              <button
                className={styles.addToCartBtn}
                onClick={() => addItem(product, quantity)}
              >
                {cartQty > 0 ? `Add More (${cartQty} in cart)` : 'Add to Cart'}
              </button>
            </div>

            {cartQty > 0 && (
              <Link href="/cart" className={styles.goToCart}>
                Go to Cart →
              </Link>
            )}

            {/* Features */}
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span>🌿</span> 100% Natural & Pure
              </div>
              <div className={styles.featureItem}>
                <span>🧪</span> Lab Tested Quality
              </div>
              <div className={styles.featureItem}>
                <span>📦</span> Secure Packaging
              </div>
              <div className={styles.featureItem}>
                <span>🚚</span> Fast Delivery
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>You May Also Like</h2>
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
