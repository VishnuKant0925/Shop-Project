'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CallbackItem } from '@/types';
import styles from '../admin.module.css';

const STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'resolved', label: 'Resolved' },
];

const badgeFor: Record<CallbackItem['status'], string> = {
  pending: styles.badgeWarn,
  contacted: styles.badgeInfo,
  resolved: styles.badgeOk,
};

const whatsappHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
};

export default function AdminEnquiriesPage() {
  const [items, setItems] = useState<CallbackItem[]>([]);
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCallbacks({ status, q: query, page });
      setItems(res.data);
      setPages(res.pagination.pages);
      setPendingCount(res.pendingCount);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load enquiries');
    } finally {
      setLoading(false);
    }
  }, [status, query, page]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), query ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [load, query]);

  const updateStatus = async (item: CallbackItem, next: CallbackItem['status']) => {
    try {
      const updated = await api.updateCallbackStatus(item.id, next);
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      if (item.status === 'pending' && next !== 'pending') setPendingCount((c) => Math.max(0, c - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update enquiry');
    }
  };

  const remove = async (item: CallbackItem) => {
    if (!window.confirm(`Delete the enquiry from ${item.name}?`)) return;
    try {
      await api.deleteCallback(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete enquiry');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Enquiries &amp; Callbacks</h1>
          <p className={styles.subtitle}>{pendingCount} new request{pendingCount === 1 ? '' : 's'} from the contact form</p>
        </div>
        <button type="button" className={styles.btn} onClick={() => void load()}>Refresh</button>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, phone or message…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <div className={styles.chips}>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`${styles.chip} ${status === s.value ? styles.chipActive : ''}`}
              onClick={() => { setStatus(s.value); setPage(1); }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && items.length === 0 ? (
        <div className={styles.empty}>Loading…</div>
      ) : items.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>No enquiries here.</div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>
                  {item.name}{' '}
                  <span className={`${styles.badge} ${badgeFor[item.status]}`}>
                    {item.status === 'pending' ? 'new' : item.status}
                  </span>
                </div>
                <div className={styles.rowMeta}>
                  {item.phone}
                  {item.email ? ` · ${item.email}` : ''} · {new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                {item.message && <p className={styles.rowMeta} style={{ marginTop: 6, color: 'var(--color-on-surface)' }}>{item.message}</p>}
              </div>
              <div className={styles.rowActions}>
                <a className={styles.btnPrimary} href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>Call</a>
                <a className={styles.btn} href={whatsappHref(item.phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                {item.status !== 'contacted' && item.status !== 'resolved' && (
                  <button type="button" className={styles.btn} onClick={() => updateStatus(item, 'contacted')}>Mark contacted</button>
                )}
                {item.status !== 'resolved' && (
                  <button type="button" className={styles.btn} onClick={() => updateStatus(item, 'resolved')}>Resolve</button>
                )}
                <button type="button" className={styles.btnDanger} onClick={() => remove(item)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className={styles.pager}>
          <button type="button" className={styles.btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className={styles.btn} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
