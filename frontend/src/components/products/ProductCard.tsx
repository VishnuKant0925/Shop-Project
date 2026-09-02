'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatCurrency } from '@/data';
import { useCart } from '@/context/CartContext';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, getItemQuantity } = useCart();
  const qty = getItemQuantity(product.id);

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {product.badge && (
        <span className={styles.badge}>{product.badge}</span>
      )}

      <Link href={`/products/${product.slug}`} className={styles.imageWrapper}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={400}
          className={styles.image}
        />
        <div className={styles.imageOverlay}>
          <span>View Details</span>
        </div>
      </Link>

      <div className={styles.content}>
        <Link href={`/products/${product.slug}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>
        <p className={styles.desc}>{product.description.substring(0, 80)}...</p>

        <div className={styles.footer}>
          <div className={styles.pricing}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            <span className={styles.unit}>/ {product.unit}</span>
          </div>

          <button
            className={`${styles.addBtn} ${qty > 0 ? styles.addBtnActive : ''}`}
            onClick={() => addItem(product)}
          >
            {qty > 0 ? (
              <span className={styles.addBtnContent}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                In Cart ({qty})
              </span>
            ) : (
              <span className={styles.addBtnContent}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to Cart
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
