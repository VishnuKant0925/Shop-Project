'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

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
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroBadge}>Get In Touch</span>
          <h1 className={styles.heroTitle}>Contact Us</h1>
          <p className={styles.heroSubtitle}>
            Questions about our products or services? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className={`${styles.contactSection} container`}>
        <div className={styles.contactGrid}>
          {/* Contact Info */}
          <div className={styles.infoSide}>
            <h2 className={styles.infoTitle}>Let&apos;s Connect</h2>
            <p className={styles.infoDesc}>
              Visit our shop, call us, or fill out the form — no login required. We&apos;ll get back
              to you as quickly as possible.
            </p>

            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon} aria-hidden="true">📍</span>
                <div>
                  <h3>Visit Us</h3>
                  <p>Vaishali Bus Stand Road,<br />Lalganj 844121, Vaishali, Bihar</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon} aria-hidden="true">📞</span>
                <div>
                  <h3>Call Us</h3>
                  <p><a href="tel:+919934787476">+91 99347 87476</a></p>
                  <p><a href="tel:+918226889960">+91 82268 89960</a></p>
                  <small>Mon-Sun, 8AM - 9PM</small>
                </div>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon} aria-hidden="true">✉️</span>
                <div>
                  <h3>Email Us</h3>
                  <p><a href="mailto:asharfipandit844121@gmail.com">asharfipandit844121@gmail.com</a></p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon} aria-hidden="true">💬</span>
                <div>
                  <h3>WhatsApp</h3>
                  <p><a href="https://wa.me/919934787476" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>
                  <small>Quick responses!</small>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className={styles.formSide}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3 className={styles.formTitle}>Request a Callback</h3>
              <p className={styles.formSubtitle}>No account needed — just fill in your details.</p>

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
