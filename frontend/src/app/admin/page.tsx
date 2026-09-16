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

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#16A34A',
  completed: '#6B7280',
  cancelled: '#DC2626',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.errorWrap}>
          <p>{error}</p>
          <button onClick={fetchStats} className={styles.retryBtn}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { icon: '💰', label: 'Revenue', value: formatCurrency(stats.totalRevenue), change: stats.revenueChange, positive: !stats.revenueChange.startsWith('-') },
    { icon: '📦', label: 'Orders', value: String(stats.totalOrders), change: stats.ordersChange, positive: !stats.ordersChange.startsWith('-') },
    { icon: '🛍️', label: 'Products', value: String(stats.totalProducts), change: '', positive: true },
    { icon: '⚙️', label: 'Services', value: String(stats.totalServices), change: '', positive: true },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back, Admin! Here&apos;s your store overview.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              {stat.change && (
                <span className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Recent Orders */}
        <div className={styles.ordersCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Orders</h2>
            <Link href="/admin/orders" className={styles.viewAll}>View All →</Link>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Order ID</span>
              <span>Customer</span>
              <span>Total</span>
              <span>Status</span>
              <span>Time</span>
            </div>
            {stats.recentOrders.length === 0 ? (
              <div className={styles.emptyRow}>No orders yet</div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className={styles.tableRow}>
                  <span className={styles.orderId}>{order.orderNumber}</span>
                  <span>{order.customerName}</span>
                  <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
                  <span>
                    <span
                      className={styles.statusBadge}
                      style={{ background: `${statusColors[order.status] || '#6B7280'}15`, color: statusColors[order.status] || '#6B7280' }}
                    >
                      {order.status}
                    </span>
                  </span>
                  <span className={styles.orderTime}>{formatTimeAgo(order.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions + Inventory */}
        <div className={styles.sidePanel}>
          <div className={styles.quickActions}>
            <h3 className={styles.panelTitle}>Quick Actions</h3>
            <Link href="/admin/products" className={styles.actionBtn}>
              <span>📦</span> Add New Product
            </Link>
            <Link href="/admin/services" className={styles.actionBtn}>
              <span>⚙️</span> Update Service Rates
            </Link>
            <Link href="/admin/orders" className={styles.actionBtn}>
              <span>🛒</span> Manage Orders
            </Link>
          </div>

          <div className={styles.inventoryCard}>
            <h3 className={styles.panelTitle}>Inventory Alert</h3>
            {stats.lowStockProducts.length === 0 ? (
              <p className={styles.noAlerts}>All products are well stocked! ✅</p>
            ) : (
              stats.lowStockProducts.map((p) => (
                <div key={p.id} className={styles.inventoryItem}>
                  <span>{p.name}</span>
                  <span className={styles.stockCount}>
                    {p.stockQuantity} {p.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
