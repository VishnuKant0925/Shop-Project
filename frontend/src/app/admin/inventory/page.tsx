'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import { useSettings } from '@/context/SettingsContext';
import { Product, StockMovement, StockReason } from '@/types';
import ui from '../admin.module.css';

type Action = 'restock' | 'wastage' | 'correction';
type Filter = 'all' | 'low' | 'out';

const reasonLabel: Record<StockReason, string> = {
  online_order: 'Online order',
  order_cancelled: 'Order cancelled',
  counter_bill: 'Counter bill',
  bill_void: 'Bill cancelled',
  restock: 'Restock',
  wastage: 'Wastage',
  correction: 'Stock count',
};

const actionTitle: Record<Action, string> = {
  restock: 'Add stock',
  wastage: 'Remove (wastage / damage)',
  correction: 'Set counted stock',
};

const qty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));

export default function InventoryPage() {
  const { products, refreshCatalog, isLoading } = useProductCatalog();
  const { settings } = useSettings();
  const threshold = settings.lowStockThreshold;
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [active, setActive] = useState<{ product: Product; action: Action } | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [recent, setRecent] = useState<StockMovement[]>([]);

  useEffect(() => {
    api.getStockMovements().then((r) => setRecent(r.data.slice(0, 15))).catch(() => setRecent([]));
  }, [products]);

  const counts = useMemo(() => ({
    all: products.length,
    low: products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= threshold).length,
    out: products.filter((p) => p.stockQuantity <= 0).length,
  }), [products, threshold]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .filter((p) => filter === 'all' || (filter === 'out' ? p.stockQuantity <= 0 : p.stockQuantity > 0 && p.stockQuantity <= threshold))
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }, [products, search, filter, threshold]);

  const open = (product: Product, action: Action) => {
    setActive({ product, action });
    setAmount(action === 'correction' ? String(product.stockQuantity) : '');
    setNote('');
    setFormError('');
  };

  const openHistory = async (product: Product) => {
    setHistoryFor(product);
    setMovements([]);
    try {
      setMovements((await api.getStockMovements({ product: product.id })).data);
    } catch {
      setMovements([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setSaving(true);
    setFormError('');
    try {
      const value = Number(amount);
      await api.adjustStock(active.product.id, active.action === 'correction'
        ? { reason: 'correction', setTo: value, note }
        : { reason: active.action, quantity: value, note });
      await refreshCatalog();
      setActive(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not update stock');
    } finally {
      setSaving(false);
    }
  };

  const status = (p: Product) =>
    p.stockQuantity <= 0
      ? <span className={`${ui.badge} ${ui.badgeMuted}`} style={{ color: '#b91c1c' }}>Out of stock</span>
      : p.stockQuantity <= threshold
        ? <span className={`${ui.badge} ${ui.badgeWarn}`}>Low</span>
        : <span className={`${ui.badge} ${ui.badgeOk}`}>In stock</span>;

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Inventory</h1>
          <p className={ui.subtitle}>Stock updates itself on every online order and counter bill. Low = {threshold} or less (change in Settings).</p>
        </div>
      </div>

      <div className={ui.toolbar}>
        <input className={ui.search} type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className={ui.chips}>
          {(['all', 'low', 'out'] as Filter[]).map((f) => (
            <button key={f} type="button" className={`${ui.chip} ${filter === f ? ui.chipActive : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'low' ? 'Low' : 'Out'} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={ui.empty}>Loading…</div>
      ) : visible.length === 0 ? (
        <div className={`${ui.card} ${ui.empty}`}>Nothing here.</div>
      ) : (
        <div className={ui.list}>
          {visible.map((p) => (
            <div key={p.id} className={ui.row}>
              <div className={ui.rowMain}>
                <div className={ui.rowTitle}>{p.name} {status(p)}</div>
                <div className={ui.rowMeta}>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-on-surface)' }}>{qty(p.stockQuantity)} {p.unit}</strong>
                  {!p.isActive && ' · hidden from store'}
                </div>
              </div>
              <div className={ui.rowActions}>
                <button type="button" className={ui.btnPrimary} onClick={() => open(p, 'restock')}>+ Restock</button>
                <button type="button" className={ui.btn} onClick={() => open(p, 'wastage')}>Wastage</button>
                <button type="button" className={ui.btn} onClick={() => open(p, 'correction')}>Set count</button>
                <button type="button" className={ui.btnGhost} onClick={() => void openHistory(p)}>History</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Recent stock activity</h2>
          <MovementList items={recent} showProduct />
        </section>
      )}

      {active && (
        <div className={ui.modalBackdrop} onClick={() => setActive(null)}>
          <form className={ui.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2 className={ui.modalTitle}>{actionTitle[active.action]} — {active.product.name}</h2>
            <p className={ui.hint} style={{ marginBottom: 12 }}>
              Current stock: {qty(active.product.stockQuantity)} {active.product.unit}
            </p>
            {formError && <div className={ui.error} style={{ marginBottom: 12 }}>{formError}</div>}
            <div className={ui.form}>
              <div className={ui.field}>
                <label htmlFor="stock-amount">
                  {active.action === 'correction' ? `Counted stock (${active.product.unit})` : `Quantity (${active.product.unit})`}
                </label>
                <input
                  id="stock-amount"
                  type="number"
                  inputMode="decimal"
                  min={active.action === 'correction' ? 0 : 0.01}
                  step="0.01"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className={ui.field}>
                <label htmlFor="stock-note">Note (optional)</label>
                <input id="stock-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder={active.action === 'restock' ? 'e.g. New batch milled' : 'e.g. Damaged packet'} />
              </div>
              <div className={ui.formActions}>
                <button type="button" className={ui.btn} onClick={() => setActive(null)}>Cancel</button>
                <button type="submit" className={ui.btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {historyFor && (
        <div className={ui.modalBackdrop} onClick={() => setHistoryFor(null)}>
          <div className={ui.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={ui.modalTitle}>Stock history — {historyFor.name}</h2>
            {movements.length === 0 ? <p className={ui.hint}>No stock changes recorded yet.</p> : <MovementList items={movements} />}
            <div className={ui.formActions} style={{ marginTop: 16 }}>
              <button type="button" className={ui.btn} onClick={() => setHistoryFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MovementList({ items, showProduct = false }: { items: StockMovement[]; showProduct?: boolean }) {
  return (
    <div className={ui.list} style={{ gap: 6 }}>
      {items.map((m) => (
        <div key={m.id} className={ui.row} style={{ padding: '10px 12px' }}>
          <div className={ui.rowMain} style={{ minWidth: 160 }}>
            <div className={ui.rowTitle} style={{ fontSize: '0.875rem' }}>
              {showProduct ? `${m.productName} · ` : ''}{reasonLabel[m.reason]}
              {m.reference ? ` · ${m.reference}` : ''}
            </div>
            <div className={ui.rowMeta}>
              {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              {m.note ? ` · ${m.note}` : ''}
            </div>
          </div>
          <strong style={{ color: m.change >= 0 ? '#15803d' : '#b91c1c' }}>
            {m.change >= 0 ? '+' : ''}{qty(m.change)}
            {m.balanceAfter !== null && <span className={ui.rowMeta} style={{ fontWeight: 400 }}> → {qty(m.balanceAfter)}</span>}
          </strong>
        </div>
      ))}
    </div>
  );
}
