'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { defaultSettings } from '@/context/SettingsContext';
import { MillRate, StoreSettings } from '@/types';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
  const [form, setForm] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((s) => setForm({ ...defaultSettings, ...s }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved('');
  };

  const setRate = (index: number, patch: Partial<MillRate>) =>
    set('millRates', form.millRates.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const updated = await api.updateSettings({
        ...form,
        phones: form.phones.map((p) => p.trim()).filter(Boolean),
        millRates: form.millRates.filter((r) => r.label.trim() && r.price.trim()),
      });
      setForm({ ...defaultSettings, ...updated });
      setSaved('Settings saved. The website updates instantly for visitors.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.empty}>Loading settings…</div>;

  return (
    <form className={styles.page} onSubmit={handleSave}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Store Settings</h1>
          <p className={styles.subtitle}>Control ordering, payments, tax and the details shown on the website</p>
        </div>
        <button type="submit" className={styles.btnPrimary} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {saved && <div className={styles.success}>{saved}</div>}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Online ordering</h2>
        <div className={styles.form}>
          <label className={`${styles.toggleRow} ${styles.fieldFull}`}>
            <input
              type="checkbox"
              checked={form.acceptingOrders}
              onChange={(e) => set('acceptingOrders', e.target.checked)}
            />
            Accept online orders
          </label>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="closedMessage">Message shown when ordering is paused</label>
            <input id="closedMessage" value={form.closedMessage} maxLength={200} onChange={(e) => set('closedMessage', e.target.value)} />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="announcement">Announcement bar (leave empty to hide)</label>
            <input
              id="announcement"
              value={form.announcement}
              maxLength={160}
              placeholder="e.g. Diwali offer: use code PANDIT15 for 15% off"
              onChange={(e) => set('announcement', e.target.value)}
            />
            <span className={styles.hint}>Shown at the top of every page.</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Payments &amp; tax</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="upiId">UPI ID</label>
            <input id="upiId" value={form.upiId} required onChange={(e) => set('upiId', e.target.value)} />
            <span className={styles.hint}>Checkout QR codes are generated from this.</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="upiName">UPI payee name</label>
            <input id="upiName" value={form.upiName} required onChange={(e) => set('upiName', e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="taxRate">GST rate (%)</label>
            <input
              id="taxRate"
              type="number"
              min={0}
              max={28}
              step={0.5}
              value={form.taxRate}
              onChange={(e) => set('taxRate', Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Contact details</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="phone1">Primary phone</label>
            <input id="phone1" type="tel" value={form.phones[0] || ''} onChange={(e) => set('phones', [e.target.value, form.phones[1] || ''])} />
          </div>
          <div className={styles.field}>
            <label htmlFor="phone2">Second phone</label>
            <input id="phone2" type="tel" value={form.phones[1] || ''} onChange={(e) => set('phones', [form.phones[0] || '', e.target.value])} />
          </div>
          <div className={styles.field}>
            <label htmlFor="whatsapp">WhatsApp number (with country code)</label>
            <input id="whatsapp" value={form.whatsapp} placeholder="919934787476" onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="address">Address</label>
            <input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="hours">Opening hours</label>
            <input id="hours" value={form.hours} onChange={(e) => set('hours', e.target.value)} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Today&apos;s mill rates (home page ticker)</h2>
        <div className={styles.list}>
          {form.millRates.map((rate, i) => (
            <div key={i} className={styles.rateRow}>
              <input
                className={styles.search}
                aria-label="Rate label"
                value={rate.label}
                placeholder="Yellow Mustard Oil"
                onChange={(e) => setRate(i, { label: e.target.value })}
              />
              <input
                className={styles.search}
                aria-label="Price"
                value={rate.price}
                placeholder="₹172/L"
                onChange={(e) => setRate(i, { price: e.target.value })}
              />
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => set('millRates', form.millRates.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${rate.label || 'rate'}`}
              >
                ✕
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className={styles.btn}
              onClick={() => set('millRates', [...form.millRates, { label: '', price: '' }])}
              disabled={form.millRates.length >= 12}
            >
              + Add rate
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
