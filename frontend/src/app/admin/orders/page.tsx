'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/data';
import styles from './page.module.css';

const statusOptions: OrderStatus[] = ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'];
const statusColors: Record<string, string> = {
  pending: '#F59E0B', paid: '#3B82F6', preparing: '#8B5CF6',
  ready: '#16A34A', completed: '#6B7280', cancelled: '#DC2626',
};
const statusLabels: Record<string, string> = {
  pending: 'Pending Payment', paid: 'Paid — Review', preparing: 'Preparing',
  ready: 'Ready for Pickup', completed: 'Completed', cancelled: 'Cancelled',
};

const actionForStatus: Record<string, { label: string; next: OrderStatus; color: string } | null> = {
  paid: { label: 'Start Preparing', next: 'preparing', color: '#8B5CF6' },
  preparing: { label: 'Mark Ready for Pickup', next: 'ready', color: '#16A34A' },
  ready: { label: 'Mark Completed', next: 'completed', color: '#6B7280' },
  pending: null,
  completed: null,
  cancelled: null,
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}><span className={styles.spinner} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>Manage customer orders, verify payments &amp; fulfil pickups</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchOrders} title="Refresh orders">
          🔄
        </button>
      </div>

      {/* Status Filters */}
      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.filterBtnActive : ''}`} onClick={() => setFilterStatus('all')}>
          All ({orders.length})
        </button>
        {statusOptions.map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filterStatus === s ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterStatus(s)}
            style={filterStatus === s ? { background: `${statusColors[s]}15`, color: statusColors[s], borderColor: `${statusColors[s]}30` } : {}}
          >
            {statusLabels[s]} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📦</span>
          <p>No orders {filterStatus !== 'all' ? `with status "${statusLabels[filterStatus]}"` : 'yet'}</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((order) => {
            const expanded = expandedId === order.id;
            const action = actionForStatus[order.status];
            return (
              <div key={order.id} className={`${styles.orderCard} ${expanded ? styles.orderCardExpanded : ''}`}>
                {/* Header Row */}
                <div className={styles.orderHeader} onClick={() => setExpandedId(expanded ? null : order.id)}>
                  <div className={styles.orderIdCol}>
                    <span className={styles.orderNum}>{order.orderNumber}</span>
                    <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className={styles.customerCol}>
                    <strong>{order.customerName}</strong>
                    <span>{order.customerPhone || order.customerEmail}</span>
                  </div>
                  <div className={styles.itemsCol}>{order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
                  <div className={styles.totalCol}>{formatCurrency(order.total)}</div>
                  <span className={styles.statusBadge} style={{ background: `${statusColors[order.status]}12`, color: statusColors[order.status] }}>
                    {statusLabels[order.status]}
                  </span>
                  <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▾</span>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className={styles.orderDetails}>
                    {/* Items */}
                    <div className={styles.detailSection}>
                      <h4>Order Items</h4>
                      <div className={styles.itemsTable}>
                        {order.items.map((item, i) => (
                          <div key={i} className={styles.detailItem}>
                            <span>{item.productName}</span>
                            <span className={styles.detailItemQty}>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                            <span className={styles.detailItemTotal}>{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                        <div className={styles.detailTotals}>
                          <div><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                          <div><span>GST (5%)</span><span>{formatCurrency(order.tax)}</span></div>
                          <div className={styles.detailGrand}><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Screenshot */}
                    <div className={styles.detailSection}>
                      <h4>Payment Proof</h4>
                      {order.paymentScreenshotUrl ? (
                        <div className={styles.screenshotWrap} onClick={() => setLightboxUrl(order.paymentScreenshotUrl || '')}>
                          <img src={order.paymentScreenshotUrl} alt="Payment screenshot" className={styles.screenshotThumb} />
                          <span className={styles.screenshotHint}>Click to enlarge</span>
                        </div>
                      ) : (
                        <p className={styles.noScreenshot}>No payment screenshot uploaded yet.</p>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className={styles.detailSection}>
                      <h4>Customer</h4>
                      <div className={styles.customerInfo}>
                        <div><span>Name</span><span>{order.customerName}</span></div>
                        <div><span>Email</span><span>{order.customerEmail}</span></div>
                        <div><span>Phone</span><span>{order.customerPhone || '—'}</span></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.orderActions}>
                      {action && (
                        <button
                          className={styles.actionBtn}
                          style={{ background: action.color }}
                          disabled={actionLoading === order.id}
                          onClick={() => handleStatusChange(order.id, action.next)}
                        >
                          {actionLoading === order.id ? '...' : action.label}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          className={styles.cancelBtn}
                          disabled={actionLoading === order.id}
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className={styles.lightbox} onClick={() => setLightboxUrl('')}>
          <button className={styles.lightboxClose} onClick={() => setLightboxUrl('')}>✕</button>
          <img src={lightboxUrl} alt="Payment screenshot full view" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  );
}
