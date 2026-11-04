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
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const qty = getItemQuantity(product.id);
  const href = `/products/${product.slug}`;
  const outOfStock = product.stockQuantity <= 0;

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Link href={href} className={styles.imageWrapper} tabIndex={-1} aria-hidden="true">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={styles.image}
        />
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
      </Link>

      <div className={styles.content}>
        <h3 className={styles.name}>
          <Link href={href} className={styles.nameLink}>{product.name}</Link>
        </h3>
        <p className={styles.desc}>{product.description}</p>

        <div className={styles.footer}>
          <div className={styles.pricing}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            <span className={styles.unit}>/ {product.unit}</span>
          </div>

          {qty > 0 ? (
            <div className={styles.stepper} role="group" aria-label={`${product.name} quantity in cart`}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => updateQuantity(product.id, qty - 1)}
                aria-label={qty === 1 ? `Remove ${product.name} from cart` : `Decrease ${product.name} quantity`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">{qty === 1 ? 'delete' : 'remove'}</span>
              </button>
              <span className={styles.stepQty} aria-live="polite">{qty}</span>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => updateQuantity(product.id, qty + 1)}
                aria-label={`Increase ${product.name} quantity`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => addItem(product)}
              disabled={outOfStock}
              aria-label={`Add ${product.name} to cart`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              <span className={styles.addLabel}>{outOfStock ? 'Sold out' : 'Add'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
