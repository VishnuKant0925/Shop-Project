'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/data';
import styles from './page.module.css';
import ui from '../admin.module.css';
import { downloadBillPdf, orderToDocument } from '@/lib/billPdf';
import { useSettings } from '@/context/SettingsContext';

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
  pending: { label: 'Mark as Paid (cash / counter)', next: 'paid', color: '#3B82F6' },
  paid: { label: 'Start Preparing', next: 'preparing', color: '#8B5CF6' },
  preparing: { label: 'Mark Ready for Pickup', next: 'ready', color: '#16A34A' },
  ready: { label: 'Mark Completed', next: 'completed', color: '#6B7280' },
  completed: null,
  cancelled: null,
};

const PAGE_SIZE = 25;

const whatsappHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [listError, setListError] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const { settings } = useSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.getAllOrders({ status: filterStatus, q: query, page, limit: PAGE_SIZE });
      setOrders(res.data);
      setPages(res.pagination.pages);
      setTotal(res.pagination.total);
      setCounts(res.statusCounts || {});
      setListError('');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, query, page]);

  // Debounce typing in the search box
  useEffect(() => {
    const t = window.setTimeout(() => void fetchOrders(), query ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [fetchOrders, query]);

  // New orders / payment uploads arrive as admin notifications: refresh the list live.
  useEffect(() => {
    const socket = getSocket();
    const refresh = () => void fetchOrders();
    socket.on('notification:new', refresh);
    return () => {
      socket.off('notification:new', refresh);
    };
  }, [fetchOrders]);

  const filteredOrders = orders;

  const applyUpdate = (updated: Order) => setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Cancel this order? Its items go back into stock.')) return;
    setActionLoading(orderId);
    try {
      applyUpdate(await api.updateOrderStatus(orderId, newStatus));
      void fetchOrders();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveNote = async (order: Order) => {
    const adminNote = noteDrafts[order.id] ?? order.adminNote ?? '';
    setActionLoading(order.id);
    try {
      applyUpdate(await api.updateOrder(order.id, { adminNote }));
      setNoteDrafts((d) => {
        const next = { ...d };
        delete next[order.id];
        return next;
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to save note');
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
        <button className={styles.refreshBtn} onClick={() => void fetchOrders()} title="Refresh orders">
          🔄
        </button>
      </div>

      <input
        className={ui.search}
        type="search"
        placeholder="Search order number, name, email or phone…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        style={{ marginBottom: 12, width: '100%' }}
      />
      {listError && <div className={ui.error} style={{ marginBottom: 12 }}>{listError}</div>}

      {/* Status Filters */}
      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.filterBtnActive : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>
          All ({counts.all ?? 0})
        </button>
        {statusOptions.map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filterStatus === s ? styles.filterBtnActive : ''}`}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            style={filterStatus === s ? { background: `${statusColors[s]}15`, color: statusColors[s], borderColor: `${statusColors[s]}30` } : {}}
          >
            {statusLabels[s]} ({counts[s] ?? 0})
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
                          {!!order.discount && (
                            <div><span>Coupon {order.couponCode}</span><span>−{formatCurrency(order.discount)}</span></div>
                          )}
                          <div><span>GST</span><span>{formatCurrency(order.tax)}</span></div>
                          <div className={styles.detailGrand}><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Screenshot */}
                    <div className={styles.detailSection}>
                      <h4>Payment Proof</h4>
                      {order.paymentScreenshotUrl ? (
                        <div className={styles.screenshotWrap} onClick={() => setLightboxUrl(order.paymentScreenshotUrl || '')}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- customer-uploaded screenshot (Cloudinary or API host), not optimisable by next/image */}
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
                        <div><span>Customer note</span><span>{order.shippingAddress || '—'}</span></div>
                      </div>
                      {order.customerPhone && (
                        <div className={ui.rowActions} style={{ marginTop: 10 }}>
                          <a className={ui.btn} href={`tel:${order.customerPhone}`}>Call</a>
                          <a className={ui.btn} href={whatsappHref(order.customerPhone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                        </div>
                      )}
                    </div>

                    {/* Internal note */}
                    <div className={styles.detailSection}>
                      <h4>Internal note (admins only)</h4>
                      <div className={ui.field}>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={noteDrafts[order.id] ?? order.adminNote ?? ''}
                          onChange={(e) => setNoteDrafts((d) => ({ ...d, [order.id]: e.target.value }))}
                          placeholder="e.g. Paid cash at counter, customer will collect at 6pm"
                        />
                      </div>
                      {noteDrafts[order.id] !== undefined && noteDrafts[order.id] !== (order.adminNote ?? '') && (
                        <button type="button" className={ui.btn} style={{ marginTop: 8 }} disabled={actionLoading === order.id} onClick={() => handleSaveNote(order)}>
                          Save note
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={styles.orderActions}>
                      {order.status !== 'pending' && order.status !== 'cancelled' && (
                        <button type="button" className={ui.btn} onClick={() => void downloadBillPdf(orderToDocument(order), settings)}>
                          Download invoice
                        </button>
                      )}
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
                      {order.status !== 'cancelled' && (
                        <label className={ui.field} style={{ minWidth: 180 }}>
                          <span className={ui.hint}>Set status manually</span>
                          <select
                            value={order.status}
                            disabled={actionLoading === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          >
                            {statusOptions.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className={ui.pager} style={{ marginTop: 16 }}>
          <button type="button" className={ui.btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {pages} · {total} orders</span>
          <button type="button" className={ui.btn} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className={styles.lightbox} onClick={() => setLightboxUrl('')}>
          <button className={styles.lightboxClose} onClick={() => setLightboxUrl('')}>✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size customer-uploaded screenshot */}
          <img src={lightboxUrl} alt="Payment screenshot full view" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  );
}
