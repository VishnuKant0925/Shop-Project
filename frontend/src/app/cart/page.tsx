'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/data';
import styles from './page.module.css';

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={`${styles.empty} container`}>
          <span className={styles.emptyIcon}>🛒</span>
          <h2>Your cart is empty</h2>
          <p>Add some delicious spices and oils to get started!</p>
          <Link href="/products" className={styles.shopBtn}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const tax = totalPrice * 0.05;
  const grandTotal = totalPrice + tax;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Shopping Cart</h1>
          <span className={styles.itemCount}>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
        </div>

        <div className={styles.cartLayout}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {items.map((item) => (
              <div key={item.product.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    width={100}
                    height={100}
                    className={styles.itemImg}
                  />
                </div>

                <div className={styles.itemDetails}>
                  <Link href={`/products/${item.product.slug}`} className={styles.itemName}>
                    {item.product.name}
                  </Link>
                  <span className={styles.itemPrice}>
                    {formatCurrency(item.product.price)} / {item.product.unit}
                  </span>
                </div>

                <div className={styles.itemQuantity}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div className={styles.itemTotal}>
                  {formatCurrency(item.product.price * item.quantity)}
                </div>

                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.product.id)}
                  aria-label="Remove item"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}

            <div className={styles.cartActions}>
              <Link href="/products" className={styles.continueShopping}>
                ← Continue Shopping
              </Link>
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax (GST 5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery</span>
              <span className={styles.freeDelivery}>FREE</span>
            </div>

            <div className={styles.summaryDivider} />

            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <Link href="/auth/login" className={styles.checkoutBtn}>
              Proceed to Checkout
            </Link>

            <p className={styles.checkoutNote}>
              You&apos;ll need to login or register to place an order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
