'use client';

import React from 'react';
import Link from 'next/link';
import { products, services, formatCurrency } from '@/data';
import styles from './page.module.css';

const recentOrders = [
  { id: 'ORD-001', customer: 'Rahul Sharma', total: 1260, status: 'delivered', date: '2 hours ago' },
  { id: 'ORD-002', customer: 'Priya Patel', total: 840, status: 'processing', date: '5 hours ago' },
  { id: 'ORD-003', customer: 'Amit Kumar', total: 2100, status: 'confirmed', date: '1 day ago' },
  { id: 'ORD-004', customer: 'Sneha Gupta', total: 560, status: 'pending', date: '1 day ago' },
  { id: 'ORD-005', customer: 'Vikash Singh', total: 1680, status: 'shipped', date: '2 days ago' },
];

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#06B6D4',
  delivered: '#16A34A',
  cancelled: '#DC2626',
};

export default function AdminDashboard() {
  const stats = [
    { icon: '💰', label: 'Revenue', value: '₹1,24,500', change: '+12.5%', positive: true },
    { icon: '📦', label: 'Orders', value: '148', change: '+8.2%', positive: true },
    { icon: '🛍️', label: 'Products', value: String(products.length), change: '', positive: true },
    { icon: '⚙️', label: 'Services', value: String(services.length), change: '', positive: true },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back, Admin! Here&apos;s your store overview.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
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
            {recentOrders.map((order) => (
              <div key={order.id} className={styles.tableRow}>
                <span className={styles.orderId}>{order.id}</span>
                <span>{order.customer}</span>
                <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
                <span>
                  <span
                    className={styles.statusBadge}
                    style={{ background: `${statusColors[order.status]}15`, color: statusColors[order.status] }}
                  >
                    {order.status}
                  </span>
                </span>
                <span className={styles.orderTime}>{order.date}</span>
              </div>
            ))}
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
            {products
              .filter((p) => p.stockQuantity < 40)
              .map((p) => (
                <div key={p.id} className={styles.inventoryItem}>
                  <span>{p.name}</span>
                  <span className={styles.stockCount}>
                    {p.stockQuantity} {p.unit}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
