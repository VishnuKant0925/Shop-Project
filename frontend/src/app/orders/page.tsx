'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
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

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, router, fetchOrders]);

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
                        <div><span>GST (5%)</span><span>{formatCurrency(order.tax)}</span></div>
                        <div className={styles.grandTotal}>
                          <span>Total</span><span>{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Screenshot */}
                    {order.paymentScreenshotUrl && (
                      <div className={styles.detailSection}>
                        <h4>Payment Proof</h4>
                        <div className={styles.screenshotWrap}>
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
