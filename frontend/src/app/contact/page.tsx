'use client';

import React, { useState } from 'react';
import styles from './page.module.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', phone: '', email: '', message: '' });
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
                <span className={styles.infoCardIcon}>📍</span>
                <div>
                  <h4>Visit Us</h4>
                  <p>Main Market Road,<br />Your City, India</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon}>📞</span>
                <div>
                  <h4>Call Us</h4>
                  <p>+91 98765 43210</p>
                  <small>Mon-Sat, 8AM - 8PM</small>
                </div>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon}>✉️</span>
                <div>
                  <h4>Email Us</h4>
                  <p>info@newpanditmasala.com</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon}>💬</span>
                <div>
                  <h4>WhatsApp</h4>
                  <p>+91 98765 43210</p>
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
                <div className={styles.success}>
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
                        placeholder="+91 98765 43210"
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

                  <button type="submit" className={styles.submitBtn}>
                    Send Message
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
