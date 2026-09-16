'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, DashboardStats } from '@/lib/api';
import styles from './page.module.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  paid: { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  preparing: { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  ready: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  completed: { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
};

const cleanChange = (change: string) => {
  if (!change) return '';
  return change.replace(/^\++/, '+');
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Loading mill metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.errorWrap}>
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h3>Error loading metrics</h3>
          <p>{error}</p>
          <button onClick={() => fetchStats(true)} className={styles.retryBtn}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      icon: '💰',
      label: 'Gross Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: cleanChange(stats.revenueChange),
      positive: !stats.revenueChange.startsWith('-'),
      subtext: 'vs previous 30 days',
      theme: 'amber',
    },
    {
      icon: '🛒',
      label: 'Total Orders',
      value: String(stats.totalOrders),
      change: cleanChange(stats.ordersChange),
      positive: !stats.ordersChange.startsWith('-'),
      subtext: 'vs previous 30 days',
      theme: 'rust',
    },
    {
      icon: '📦',
      label: 'Catalog Products',
      value: String(stats.totalProducts),
      change: '',
      positive: true,
      subtext: 'Active retail items',
      theme: 'emerald',
    },
    {
      icon: '⚙️',
      label: 'Active Services',
      value: String(stats.totalServices),
      change: '',
      positive: true,
      subtext: 'Expelling & Chakki slots',
      theme: 'purple',
    },
  ];

  return (
    <div className={styles.dashboard}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>Mill Dashboard</h1>
          <p className={styles.subtitle}>
            Real-time business performance, order processing, and mill floor inventory.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => fetchStats(true)}
            className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ''}`}
            disabled={refreshing}
            title="Refresh metrics"
          >
            <span>🔄</span>
            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          <Link href="/admin/products" className={styles.newProductBtn}>
            <span>+</span> Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${styles.statCard} ${styles[`theme_${stat.theme}`]}`}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{stat.label}</span>
              <div className={styles.statIcon}>{stat.icon}</div>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statFooter}>
              {stat.change ? (
                <span className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}>
                  {stat.positive ? '↑' : '↓'} {stat.change}
                </span>
              ) : null}
              <span className={styles.statSubtext}>{stat.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Recent Orders Section */}
        <div className={styles.ordersCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
              <p className={styles.cardSub}>Latest customer purchases awaiting pickup or dispatch</p>
            </div>
            <Link href="/admin/orders" className={styles.viewAllBtn}>
              View All Orders →
            </Link>
          </div>

          <div className={styles.tableWrap}>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Order ID</span>
                <span>Customer</span>
                <span>Amount</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Placed</span>
              </div>
              {stats.recentOrders.length === 0 ? (
                <div className={styles.emptyRow}>
                  <span>📭</span>
                  <p>No orders registered yet</p>
                </div>
              ) : (
                stats.recentOrders.map((order) => {
                  const statusConf = statusColors[order.status] || { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' };
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders`}
                      className={styles.tableRow}
                    >
                      <div className={styles.orderIdGroup}>
                        <span className={styles.orderId}>{order.orderNumber}</span>
                      </div>
                      <div className={styles.customerCol}>
                        <span className={styles.customerName}>{order.customerName}</span>
                        <span className={styles.customerEmail}>{order.customerEmail}</span>
                      </div>
                      <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
                      <div>
                        <span
                          className={styles.statusBadge}
                          style={{
                            backgroundColor: statusConf.bg,
                            color: statusConf.text,
                          }}
                        >
                          <span className={styles.badgeDot} style={{ backgroundColor: statusConf.dot }} />
                          {order.status}
                        </span>
                      </div>
                      <span className={styles.orderTime}>{formatTimeAgo(order.createdAt)}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Side Panel: Quick Actions & Inventory */}
        <div className={styles.sidePanel}>
          {/* Quick Actions */}
          <div className={styles.quickActionsCard}>
            <h3 className={styles.panelTitle}>Quick Mill Actions</h3>
            <div className={styles.actionGrid}>
              <Link href="/admin/products" className={styles.actionBtn}>
                <span className={styles.actionIcon}>📦</span>
                <div className={styles.actionMeta}>
                  <strong>Product Catalog</strong>
                  <small>Add or edit prices & stock</small>
                </div>
                <span className={styles.actionArrow}>→</span>
              </Link>
              <Link href="/admin/services" className={styles.actionBtn}>
                <span className={styles.actionIcon}>⚙️</span>
                <div className={styles.actionMeta}>
                  <strong>Milling Services</strong>
                  <small>Update expeller rates</small>
                </div>
                <span className={styles.actionArrow}>→</span>
              </Link>
              <Link href="/admin/orders" className={styles.actionBtn}>
                <span className={styles.actionIcon}>🛒</span>
                <div className={styles.actionMeta}>
                  <strong>Process Orders</strong>
                  <small>Update preparation status</small>
                </div>
                <span className={styles.actionArrow}>→</span>
              </Link>
            </div>
          </div>

          {/* Low Stock Warning Card */}
          <div className={styles.inventoryCard}>
            <div className={styles.inventoryHeader}>
              <h3 className={styles.panelTitle}>Low Stock Watchlist</h3>
              <span className={styles.alertCountBadge}>
                {stats.lowStockProducts.length} items
              </span>
            </div>
            {stats.lowStockProducts.length === 0 ? (
              <div className={styles.noAlerts}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <p>All stock levels are optimal</p>
              </div>
            ) : (
              <div className={styles.inventoryList}>
                {stats.lowStockProducts.map((p) => (
                  <div key={p.id} className={styles.inventoryItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{p.name}</span>
                      <span className={styles.itemWarningText}>Low inventory alert</span>
                    </div>
                    <span className={styles.stockCount}>
                      {p.stockQuantity} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
