'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/data';
import styles from './page.module.css';

const mockOrders = [
  { id: 'ORD-001', customer: 'Rahul Sharma', email: 'rahul@email.com', phone: '+91 99887 76655', items: 3, total: 1260, status: 'delivered', date: '2024-12-01', address: '123 Main St, Delhi' },
  { id: 'ORD-002', customer: 'Priya Patel', email: 'priya@email.com', phone: '+91 88776 65544', items: 2, total: 840, status: 'processing', date: '2024-12-02', address: '456 MG Road, Mumbai' },
  { id: 'ORD-003', customer: 'Amit Kumar', email: 'amit@email.com', phone: '+91 77665 54433', items: 5, total: 2100, status: 'confirmed', date: '2024-12-02', address: '789 Park Ave, Pune' },
  { id: 'ORD-004', customer: 'Sneha Gupta', email: 'sneha@email.com', phone: '+91 66554 43322', items: 1, total: 560, status: 'pending', date: '2024-12-03', address: '101 Ring Road, Jaipur' },
  { id: 'ORD-005', customer: 'Vikash Singh', email: 'vikash@email.com', phone: '+91 55443 32211', items: 4, total: 1680, status: 'shipped', date: '2024-12-03', address: '202 Station Rd, Lucknow' },
];

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', processing: '#8B5CF6',
  shipped: '#06B6D4', delivered: '#16A34A', cancelled: '#DC2626',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  const updateStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>Manage and track all customer orders</p>
        </div>
      </div>

      {/* Status Filter */}
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
            {s.charAt(0).toUpperCase() + s.slice(1)} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span>Order ID</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span>Date</span>
          <span>Action</span>
        </div>
        {filteredOrders.map((order) => (
          <div key={order.id} className={styles.tableRow}>
            <span className={styles.orderId}>{order.id}</span>
            <div className={styles.customerCell}>
              <strong>{order.customer}</strong>
              <small>{order.phone}</small>
            </div>
            <span>{order.items}</span>
            <span className={styles.totalCell}>{formatCurrency(order.total)}</span>
            <span>
              <span className={styles.statusBadge} style={{ background: `${statusColors[order.status]}12`, color: statusColors[order.status] }}>
                {order.status}
              </span>
            </span>
            <span className={styles.dateCell}>{order.date}</span>
            <select
              value={order.status}
              onChange={(e) => updateStatus(order.id, e.target.value)}
              className={styles.statusSelect}
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
