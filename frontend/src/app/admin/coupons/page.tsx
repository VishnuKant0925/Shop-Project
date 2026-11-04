'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Coupon } from '@/types';
import styles from '../admin.module.css';

type CouponForm = {
  code: string;
  description: string;
  type: Coupon['type'];
  value: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: CouponForm = {
  code: '', description: '', type: 'percent', value: '', minOrder: '0',
  maxDiscount: '0', usageLimit: '0', expiresAt: '', isActive: true,
};

const toForm = (c: Coupon): CouponForm => ({
  code: c.code,
  description: c.description,
  type: c.type,
  value: String(c.value),
  minOrder: String(c.minOrder),
  maxDiscount: String(c.maxDiscount),
  usageLimit: String(c.usageLimit),
  expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
  isActive: c.isActive,
});

const describe = (c: Coupon) => {
  const off = c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`;
  const parts = [off];
  if (c.type === 'percent' && c.maxDiscount) parts.push(`max ₹${c.maxDiscount}`);
  if (c.minOrder) parts.push(`min order ₹${c.minOrder}`);
  parts.push(c.usageLimit ? `${c.usedCount}/${c.usageLimit} used` : `${c.usedCount} used`);
  if (c.expiresAt) parts.push(`expires ${new Date(c.expiresAt).toLocaleDateString('en-IN')}`);
  return parts.join(' · ');
};

const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      setCoupons(await api.getCoupons());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getCoupons()
      .then(setCoupons)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load coupons'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm(toForm(c));
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload: Partial<Coupon> = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 0,
      // End of the chosen day, local time
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      isActive: form.isActive,
    };
    try {
      if (editing) await api.updateCoupon(editing.id, payload);
      else await api.createCoupon(payload);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      const updated = await api.updateCoupon(c.id, { isActive: !c.isActive });
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update coupon');
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await api.deleteCoupon(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete coupon');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Coupons &amp; Offers</h1>
          <p className={styles.subtitle}>Discount codes customers can apply at checkout</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={openCreate}>+ New coupon</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.empty}>Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          No coupons yet. Create one (e.g. <strong>PANDIT15</strong>) to use in promotions.
        </div>
      ) : (
        <div className={styles.list}>
          {coupons.map((c) => (
            <div key={c.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>
                  {c.code}{' '}
                  {isExpired(c) ? (
                    <span className={`${styles.badge} ${styles.badgeMuted}`}>Expired</span>
                  ) : c.isActive ? (
                    <span className={`${styles.badge} ${styles.badgeOk}`}>Active</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeMuted}`}>Paused</span>
                  )}
                </div>
                <div className={styles.rowMeta}>{describe(c)}</div>
                {c.description && <div className={styles.rowMeta}>{c.description}</div>}
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.btn} onClick={() => toggleActive(c)}>
                  {c.isActive ? 'Pause' : 'Activate'}
                </button>
                <button type="button" className={styles.btn} onClick={() => openEdit(c)}>Edit</button>
                <button type="button" className={styles.btnDanger} onClick={() => handleDelete(c)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.modalBackdrop} onClick={() => setShowForm(false)}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2 className={styles.modalTitle}>{editing ? `Edit ${editing.code}` : 'New coupon'}</h2>
            {formError && <div className={styles.error} style={{ marginBottom: 12 }}>{formError}</div>}
            <div className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="code">Code</label>
                <input
                  id="code"
                  required
                  pattern="[A-Za-z0-9_\-]{3,20}"
                  title="3-20 letters, numbers, - or _"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="type">Discount type</label>
                <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon['type'] })}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat amount (₹)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="value">{form.type === 'percent' ? 'Percent off' : 'Rupees off'}</label>
                <input id="value" type="number" required min={1} max={form.type === 'percent' ? 100 : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="minOrder">Minimum order (₹)</label>
                <input id="minOrder" type="number" min={0} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
              </div>
              {form.type === 'percent' && (
                <div className={styles.field}>
                  <label htmlFor="maxDiscount">Max discount (₹, 0 = no cap)</label>
                  <input id="maxDiscount" type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
              )}
              <div className={styles.field}>
                <label htmlFor="usageLimit">Total uses (0 = unlimited)</label>
                <input id="usageLimit" type="number" min={0} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="expiresAt">Expires on (optional)</label>
                <input id="expiresAt" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label htmlFor="description">Description (shown to admins)</label>
                <input id="description" maxLength={120} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <label className={`${styles.toggleRow} ${styles.fieldFull}`}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
              <div className={styles.formActions}>
                <button type="button" className={styles.btn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
