'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { billToDocument, downloadBillPdf } from '@/lib/billPdf';
import { useSettings } from '@/context/SettingsContext';
import { Bill } from '@/types';
import ui from '../admin.module.css';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All' },
] as const;
type Range = (typeof RANGES)[number]['value'];

const rangeStart = (range: Range): string | undefined => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === 'today') return d.toISOString();
  if (range === 'week') { d.setDate(d.getDate() - 6); return d.toISOString(); }
  if (range === 'month') { d.setDate(1); return d.toISOString(); }
  return undefined;
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const modeLabel: Record<Bill['paymentMode'], string> = { cash: 'Cash', upi: 'UPI', card: 'Card', credit: 'Credit' };

export default function BillsPage() {
  const { settings } = useSettings();
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState({ count: 0, sales: 0, discount: 0 });
  const [range, setRange] = useState<Range>('today');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.getBills({ q: query, from: rangeStart(range), page });
      setBills(res.data);
      setSummary(res.summary);
      setPages(res.pagination.pages);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bills');
    } finally {
      setLoading(false);
    }
  }, [query, range, page]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), query ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [load, query]);

  const handleVoid = async (bill: Bill) => {
    const reason = window.prompt(`Cancel bill ${bill.billNumber}? Items go back into stock.\n\nReason (optional):`);
    if (reason === null) return;
    try {
      const updated = await api.voidBill(bill.id, reason);
      setBills((prev) => prev.map((b) => (b.id === bill.id ? updated : b)));
      void load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not cancel the bill');
    }
  };

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Bills</h1>
          <p className={ui.subtitle}>
            {summary.count} bill{summary.count === 1 ? '' : 's'} · {inr(summary.sales)} sales
            {summary.discount > 0 ? ` · ${inr(summary.discount)} discount given` : ''}
          </p>
        </div>
        <Link href="/admin/billing" className={ui.btnPrimary}>+ New bill</Link>
      </div>

      <div className={ui.toolbar}>
        <input
          className={ui.search}
          type="search"
          placeholder="Search bill no., customer or phone…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <div className={ui.chips}>
          {RANGES.map((r) => (
            <button key={r.value} type="button" className={`${ui.chip} ${range === r.value ? ui.chipActive : ''}`} onClick={() => { setRange(r.value); setPage(1); }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={ui.error}>{error}</div>}

      {loading ? (
        <div className={ui.empty}>Loading…</div>
      ) : bills.length === 0 ? (
        <div className={`${ui.card} ${ui.empty}`}>No bills for this period.</div>
      ) : (
        <div className={ui.list}>
          {bills.map((b) => (
            <div key={b.id} className={ui.row}>
              <div className={ui.rowMain}>
                <div className={ui.rowTitle}>
                  {b.billNumber} · {inr(b.total)}{' '}
                  {b.status === 'void'
                    ? <span className={`${ui.badge} ${ui.badgeMuted}`}>Cancelled</span>
                    : <span className={`${ui.badge} ${ui.badgeOk}`}>{modeLabel[b.paymentMode]}</span>}
                </div>
                <div className={ui.rowMeta}>
                  {new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {' · '}{b.items.length} item{b.items.length === 1 ? '' : 's'}
                  {b.customerName ? ` · ${b.customerName}` : ''}
                  {b.customerPhone ? ` · ${b.customerPhone}` : ''}
                  {b.discount > 0 ? ` · ${inr(b.discount)} off` : ''}
                </div>
                {b.status === 'void' && b.voidReason && <div className={ui.rowMeta}>Reason: {b.voidReason}</div>}
              </div>
              <div className={ui.rowActions}>
                <button type="button" className={ui.btn} onClick={() => void downloadBillPdf(billToDocument(b), settings)}>
                  Download PDF
                </button>
                {b.status === 'paid' && (
                  <button type="button" className={ui.btnDanger} onClick={() => handleVoid(b)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className={ui.pager}>
          <button type="button" className={ui.btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className={ui.btn} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
