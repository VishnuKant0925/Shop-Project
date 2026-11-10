'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import { api } from '@/lib/api';
import { downloadBillPdf, orderToDocument } from '@/lib/billPdf';
import { useSettings } from '@/context/SettingsContext';
import { Order } from '@/types';
import styles from './page.module.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#16A34A',
  completed: '#6B7280',
  cancelled: '#DC2626',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending Payment',
  paid: 'Payment Confirmed',
  preparing: 'Being Prepared',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusEmoji: Record<string, string> = {
  pending: '⏳',
  paid: '💳',
  preparing: '👨‍🍳',
  ready: '🎉',
  completed: '✅',
  cancelled: '❌',
};

export default function OrderHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const { addItem } = useCart();
  const { products } = useProductCatalog();
  const { settings } = useSettings();

  const handleCancel = async (order: Order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    setBusyId(order.id);
    try {
      const updated = await api.cancelMyOrder(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel the order');
    } finally {
      setBusyId('');
    }
  };

  // Put the items of a past order back in the cart (at today's price, only if still sold).
  const handleBuyAgain = (order: Order) => {
    let added = 0;
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId && p.isActive);
      if (product) {
        addItem(product, item.quantity);
        added += 1;
      }
    }
    if (added > 0) {
      router.push('/cart');
    } else {
      setNotice('These products are no longer available.');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (!user) return;
    let active = true;
    api.getMyOrders()
      .then((data) => {
        if (!active) return;
        setOrders(data);
        setError('');
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, authLoading, router]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.subtitle}>Track and manage all your orders</p>
        </div>
        <Link href="/products" className={styles.shopBtn}>
          Continue Shopping →
        </Link>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}
      {notice && <div className={styles.errorMsg}>{notice}</div>}

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📦</span>
          <h2>No orders yet</h2>
          <p>When you place orders, they&apos;ll appear here.</p>
          <Link href="/products" className={styles.emptyBtn}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            const color = statusColors[order.status] || '#6B7280';
            return (
              <div key={order.id} className={`${styles.orderCard} ${expanded ? styles.orderCardExpanded : ''}`}>
                {/* Header */}
                <div
                  className={styles.orderHeader}
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <div className={styles.orderMain}>
                    <div className={styles.orderEmoji}>
                      {statusEmoji[order.status] || '📦'}
                    </div>
                    <div>
                      <div className={styles.orderNum}>{order.orderNumber}</div>
                      <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className={styles.orderSummary}>
                    <span className={styles.orderItems}>
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </span>
                    <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
                  </div>
                  <span
                    className={styles.statusBadge}
                    style={{ background: `${color}12`, color }}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                  <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▾</span>
                </div>

                {/* Details */}
                {expanded && (
                  <div className={styles.orderDetails}>
                    {/* Status Timeline */}
                    <div className={styles.timeline}>
                      {['pending', 'paid', 'preparing', 'ready', 'completed'].map((step, idx) => {
                        const stepOrder = ['pending', 'paid', 'preparing', 'ready', 'completed'];
                        const currentIdx = stepOrder.indexOf(order.status);
                        const isCancelled = order.status === 'cancelled';
                        const isActive = !isCancelled && idx <= currentIdx;
                        return (
                          <div
                            key={step}
                            className={`${styles.timelineStep} ${isActive ? styles.timelineStepActive : ''}`}
                          >
                            <div className={styles.timelineDot} />
                            <span className={styles.timelineLabel}>
                              {statusLabels[step]}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Items */}
                    <div className={styles.detailSection}>
                      <h4>Order Items</h4>
                      <div className={styles.itemsList}>
                        {order.items.map((item, i) => (
                          <div key={i} className={styles.itemRow}>
                            <span className={styles.itemName}>{item.productName}</span>
                            <span className={styles.itemQty}>
                              {item.quantity} × {formatCurrency(item.unitPrice)}
                            </span>
                            <span className={styles.itemTotal}>
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className={styles.totals}>
                        <div><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                        {!!order.discount && (
                          <div><span>Coupon {order.couponCode}</span><span>−{formatCurrency(order.discount)}</span></div>
                        )}
                        <div><span>GST</span><span>{formatCurrency(order.tax)}</span></div>
                        <div className={styles.grandTotal}>
                          <span>Total</span><span>{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.orderActions}>
                      {order.status === 'pending' && (
                        <>
                          <Link href={`/checkout?order=${order.id}`} className={styles.payNowBtn}>
                            Pay now
                          </Link>
                          <button
                            type="button"
                            className={styles.cancelOrderBtn}
                            onClick={() => handleCancel(order)}
                            disabled={busyId === order.id}
                          >
                            {busyId === order.id ? 'Cancelling…' : 'Cancel order'}
                          </button>
                        </>
                      )}
                      {order.status !== 'pending' && (
                        <button type="button" className={styles.buyAgainBtn} onClick={() => handleBuyAgain(order)}>
                          Buy again
                        </button>
                      )}
                      {order.status !== 'pending' && order.status !== 'cancelled' && (
                        <button type="button" className={styles.buyAgainBtn} onClick={() => void downloadBillPdf(orderToDocument(order), settings)}>
                          Download invoice
                        </button>
                      )}
                    </div>

                    {/* Payment Screenshot */}
                    {order.paymentScreenshotUrl && (
                      <div className={styles.detailSection}>
                        <h4>Payment Proof</h4>
                        <div className={styles.screenshotWrap}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- customer-uploaded screenshot (Cloudinary or API host) */}
                          <img src={order.paymentScreenshotUrl} alt="Payment proof" className={styles.screenshotImg} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
