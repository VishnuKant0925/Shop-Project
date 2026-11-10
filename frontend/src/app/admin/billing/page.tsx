'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { billToDocument, downloadBillPdf } from '@/lib/billPdf';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import { useSettings } from '@/context/SettingsContext';
import { Bill, PaymentMode, Product, Service } from '@/types';
import ui from '../admin.module.css';
import styles from './billing.module.css';

type Line = {
  key: string;
  productId?: string;
  name: string;
  unit: string;
  quantity: string;
  rate: string;
  stock?: number;
};

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'credit', label: 'Credit' },
];

const money = (n: number) => Math.round(n * 100) / 100;
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
let lineSeq = 0;
const newKey = () => `l${++lineSeq}`;

export default function BillingPage() {
  const { products } = useProductCatalog();
  const { settings } = useSettings();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'flat'>('none');
  const [discountValue, setDiscountValue] = useState('');
  const [taxRateInput, setTaxRateInput] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Bill | null>(null);

  useEffect(() => {
    api.getServices().then(setServices).catch(() => setServices([]));
  }, []);

  const taxRate = taxRateInput === null ? settings.taxRate : Number(taxRateInput) || 0;

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.isActive && (!q || p.name.toLowerCase().includes(q)));
  }, [products, search]);

  /* ── Lines ── */
  const addProduct = (p: Product) => {
    setSaved(null);
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: String(money((Number(l.quantity) || 0) + 1)) } : l));
      }
      return [...prev, { key: newKey(), productId: p.id, name: p.name, unit: p.unit, quantity: '1', rate: String(p.price), stock: p.stockQuantity }];
    });
  };

  const addCustom = (service?: Service) => {
    setSaved(null);
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        name: service?.name || '',
        unit: service ? (/litre/i.test(service.rateUnit) ? 'L' : 'kg') : '',
        quantity: '1',
        rate: service ? String(service.rate) : '',
      },
    ]);
  };

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  /* ── Totals (same rules as the server) ── */
  const subtotal = money(lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.rate) || 0), 0));
  const dValue = Math.max(0, Number(discountValue) || 0);
  const discount = discountType === 'percent'
    ? money((subtotal * Math.min(dValue, 100)) / 100)
    : discountType === 'flat' ? money(Math.min(dValue, subtotal)) : 0;
  const tax = money(((subtotal - discount) * taxRate) / 100);
  const total = Math.round(subtotal - discount + tax);

  const overStock = lines.find((l) => l.productId && l.stock !== undefined && (Number(l.quantity) || 0) > l.stock);
  const invalid = lines.some((l) => !l.name.trim() || !(Number(l.quantity) > 0) || !(Number(l.rate) >= 0) || l.rate === '');

  const reset = () => {
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountType('none');
    setDiscountValue('');
    setTaxRateInput(null);
    setPaymentMode('cash');
    setNotes('');
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const bill = await api.createBill({
        items: lines.map((l) => ({
          productId: l.productId,
          name: l.productId ? undefined : l.name.trim(),
          unit: l.productId ? undefined : l.unit.trim(),
          quantity: Number(l.quantity),
          rate: Number(l.rate),
        })),
        discountType: discount > 0 ? discountType : 'none',
        discountValue: dValue,
        taxRate,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMode,
        notes: notes.trim(),
      });
      setSaved(bill);
      reset();
      await downloadBillPdf(billToDocument(bill), settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Billing Counter</h1>
          <p className={ui.subtitle}>Bill walk-in customers. Stock updates automatically.</p>
        </div>
        <Link href="/admin/bills" className={ui.btn}>Bill history</Link>
      </div>

      {saved && (
        <div className={ui.success}>
          Bill <strong>{saved.billNumber}</strong> saved ({inr(saved.total)}).{' '}
          <button type="button" className={styles.linkBtn} onClick={() => void downloadBillPdf(billToDocument(saved), settings)}>
            Download PDF again
          </button>
        </div>
      )}

      <div className={styles.layout}>
        {/* ── Item picker ── */}
        <section className={ui.card}>
          <input
            className={ui.search}
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          <div className={styles.productGrid}>
            {visibleProducts.map((p) => (
              <button key={p.id} type="button" className={styles.productBtn} onClick={() => addProduct(p)} disabled={p.stockQuantity <= 0}>
                <strong>{p.name}</strong>
                <span>{inr(p.price)}/{p.unit}</span>
                <small className={p.stockQuantity <= settings.lowStockThreshold ? styles.low : ''}>
                  {p.stockQuantity <= 0 ? 'Out of stock' : `${p.stockQuantity} ${p.unit} left`}
                </small>
              </button>
            ))}
          </div>
          <div className={styles.customRow}>
            <button type="button" className={ui.btn} onClick={() => addCustom()}>+ Custom item</button>
            {services.map((s) => (
              <button key={s.id} type="button" className={ui.chip} onClick={() => addCustom(s)}>
                + {s.name}
              </button>
            ))}
          </div>
        </section>

        {/* ── Bill ── */}
        <section className={`${ui.card} ${styles.billCard}`}>
          <h2 className={ui.cardTitle}>Current bill</h2>

          {lines.length === 0 ? (
            <p className={styles.empty}>Tap a product or add a custom item.</p>
          ) : (
            <div className={styles.lines}>
              {lines.map((l) => {
                const amount = (Number(l.quantity) || 0) * (Number(l.rate) || 0);
                const tooMuch = l.productId && l.stock !== undefined && (Number(l.quantity) || 0) > l.stock;
                return (
                  <div key={l.key} className={styles.line}>
                    {l.productId ? (
                      <span className={styles.lineName}>{l.name}</span>
                    ) : (
                      <input
                        className={styles.lineNameInput}
                        placeholder="Item name"
                        value={l.name}
                        onChange={(e) => updateLine(l.key, { name: e.target.value })}
                        aria-label="Item name"
                      />
                    )}
                    <div className={styles.lineInputs}>
                      <label>
                        <span>Qty{l.unit ? ` (${l.unit})` : ''}</span>
                        <input type="number" inputMode="decimal" min="0" step="0.01" value={l.quantity} onChange={(e) => updateLine(l.key, { quantity: e.target.value })} />
                      </label>
                      <label>
                        <span>Rate ₹</span>
                        <input type="number" inputMode="decimal" min="0" step="0.01" value={l.rate} onChange={(e) => updateLine(l.key, { rate: e.target.value })} />
                      </label>
                      <strong className={styles.lineAmount}>{inr(money(amount))}</strong>
                      <button type="button" className={styles.remove} onClick={() => removeLine(l.key)} aria-label={`Remove ${l.name || 'item'}`}>✕</button>
                    </div>
                    {tooMuch && <small className={styles.low}>Only {l.stock} {l.unit} in stock</small>}
                  </div>
                );
              })}
            </div>
          )}

          <div className={ui.form} style={{ marginTop: 16 }}>
            <div className={ui.field}>
              <label htmlFor="cust-name">Customer name (optional)</label>
              <input id="cust-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={80} />
            </div>
            <div className={ui.field}>
              <label htmlFor="cust-phone">Phone (optional)</label>
              <input id="cust-phone" type="tel" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} maxLength={20} />
            </div>
            <div className={ui.field}>
              <label>Discount</label>
              <div className={styles.inline}>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)} aria-label="Discount type">
                  <option value="none">None</option>
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0"
                  value={discountValue}
                  disabled={discountType === 'none'}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  aria-label="Discount value"
                />
              </div>
            </div>
            <div className={ui.field}>
              <label htmlFor="tax-rate">GST %</label>
              <input id="tax-rate" type="number" min="0" max="28" step="0.5" value={taxRateInput ?? String(settings.taxRate)} onChange={(e) => setTaxRateInput(e.target.value)} />
            </div>
            <div className={`${ui.field} ${ui.fieldFull}`}>
              <label>Payment</label>
              <div className={ui.chips}>
                {PAYMENT_MODES.map((m) => (
                  <button key={m.value} type="button" className={`${ui.chip} ${paymentMode === m.value ? ui.chipActive : ''}`} onClick={() => setPaymentMode(m.value)}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`${ui.field} ${ui.fieldFull}`}>
              <label htmlFor="bill-notes">Note (optional, printed on bill)</label>
              <input id="bill-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} />
            </div>
          </div>

          <dl className={styles.totals}>
            <div><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
            {discount > 0 && <div><dt>Discount</dt><dd>− {inr(discount)}</dd></div>}
            {tax > 0 && <div><dt>GST ({taxRate}%)</dt><dd>{inr(tax)}</dd></div>}
            <div className={styles.grand}><dt>Total</dt><dd>{inr(total)}</dd></div>
          </dl>

          {error && <div className={ui.error} style={{ marginTop: 12 }}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={ui.btn} onClick={reset} disabled={saving || lines.length === 0}>Clear</button>
            <button
              type="button"
              className={ui.btnPrimary}
              onClick={handleSave}
              disabled={saving || lines.length === 0 || invalid || !!overStock}
            >
              {saving ? 'Saving…' : `Save & download bill · ${inr(total)}`}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
