'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { formatPhone, telHref, useSettings } from '@/context/SettingsContext';
import styles from './page.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { settings } = useSettings();
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(`${settings.storeName}, ${settings.address}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.submitCallback({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm({ name: '', phone: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send your request. Please call us instead.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={`${styles.header} container`}>
        <h1 className={styles.heroTitle}>Contact Us</h1>
        <p className={styles.headerText}>Fastest: call or WhatsApp the mill. Open {settings.hours.replace(/^Mon\s*-\s*Sun:\s*/i, 'daily, ')}.</p>
      </header>

      <section className={`${styles.contactSection} container`}>
        <div className={styles.contactGrid}>
          {/* Quick actions + details */}
          <div className={styles.infoSide}>
            <div className={styles.quickActions}>
              <a href={telHref(settings.phones[0] || '')} className={styles.quickPrimary}>
                <span className="material-symbols-outlined" aria-hidden="true">call</span>
                Call
              </a>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.quickAction}>
                <span className="material-symbols-outlined" aria-hidden="true">chat</span>
                WhatsApp
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.quickAction}>
                <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
                Directions
              </a>
            </div>

            <dl className={styles.details}>
              <div>
                <dt>Address</dt>
                <dd>{settings.address}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  {settings.phones.map((p, i) => (
                    <React.Fragment key={p}>
                      {i > 0 && ' · '}
                      <a href={telHref(p)}>{formatPhone(p)}</a>
                    </React.Fragment>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${settings.email}`}>{settings.email}</a></dd>
              </div>
            </dl>
          </div>

          {/* Form */}
          <div className={styles.formSide}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3 className={styles.formTitle}>Request a Callback</h3>

              {submitted ? (
                <div className={styles.success} role="status">
                  <span className={styles.successIcon}>✅</span>
                  <h3>Message Sent!</h3>
                  <p>We&apos;ll call you back within 30 minutes during business hours.</p>
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label htmlFor="contact-name">Full Name *</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Your name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="contact-phone">Phone *</label>
                      <input
                        id="contact-phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label htmlFor="contact-email">Email (Optional)</label>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="contact-message">Message *</label>
                    <textarea
                      id="contact-message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>

                  {error && <p className={styles.errorMsg} role="alert">{error}</p>}

                  <button type="submit" className={styles.submitBtn} disabled={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
