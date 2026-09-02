'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { products, services, formatCurrency } from '@/data';
import ProductCard from '@/components/products/ProductCard';
import ServiceCard from '@/components/services/ServiceCard';
import styles from './page.module.css';

const heroTexts = ['Premium Spices', 'Pure Mustard Oil', 'Fresh Milling Services'];

export default function HomePage() {
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '', message: '' });
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // Hero typing animation
  useEffect(() => {
    const currentText = heroTexts[heroTextIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentText.substring(0, displayText.length + 1));
        }, 80);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2500);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentText.substring(0, displayText.length - 1));
        }, 40);
      } else {
        setIsDeleting(false);
        setHeroTextIndex((prev) => (prev + 1) % heroTexts.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, heroTextIndex]);

  // Stats counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackSubmitted(true);
    setTimeout(() => setCallbackSubmitted(false), 3000);
    setCallbackForm({ name: '', phone: '', message: '' });
  };

  return (
    <>
      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.heroParticles}>
          {[...Array(6)].map((_, i) => (
            <span key={i} className={styles.particle} style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${6 + i * 2}s`,
            }} />
          ))}
        </div>

        <div className={`${styles.heroContent} container`}>
          <div className={styles.heroLeft}>
            <span className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Trusted Since Generations
            </span>

            <h1 className={styles.heroTitle}>
              Your Destination for
              <br />
              <span className={styles.heroTyping}>
                {displayText}
                <span className={styles.heroCursor}>|</span>
              </span>
            </h1>

            <p className={styles.heroSubtitle}>
              Experience the authentic taste of India with our hand-crafted spice powders,
              cold-pressed mustard oil, and traditional milling services.
            </p>

            <div className={styles.heroActions}>
              <Link href="/products" className={styles.heroPrimaryBtn}>
                <span>Explore Products</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link href="/services" className={styles.heroSecondaryBtn}>
                View Services
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.heroImageWrapper}>
              <Image
                src="/images/hero-banner.jpg"
                alt="New Pandit Masala & Tel Mill — Spice Shop"
                width={600}
                height={500}
                className={styles.heroImage}
                priority
              />
              <div className={styles.heroImageGlow} />
            </div>

            {/* Floating product cards */}
            <div className={`${styles.floatingCard} ${styles.floatingCard1}`}>
              <span className={styles.floatingEmoji}>🌶️</span>
              <div>
                <strong>Red Chili</strong>
                <small>{formatCurrency(280)}/kg</small>
              </div>
            </div>

            <div className={`${styles.floatingCard} ${styles.floatingCard2}`}>
              <span className={styles.floatingEmoji}>🫒</span>
              <div>
                <strong>Mustard Oil</strong>
                <small>Cold Pressed</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Band ── */}
      <section className={styles.statsBand} ref={statsRef}>
        <div className={`${styles.statsContent} container`}>
          {[
            { value: '20+', label: 'Years of Trust', icon: '🏆' },
            { value: '5000+', label: 'Happy Customers', icon: '😊' },
            { value: '100%', label: 'Pure & Natural', icon: '🌿' },
            { value: '4.9', label: 'Star Rating', icon: '⭐' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`${styles.statItem} ${statsVisible ? styles.statItemVisible : ''}`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <span className={styles.statIcon}>{stat.icon}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Products Section ── */}
      <section className={`section ${styles.productsSection}`}>
        <div className="container">
          <span className="section-accent">Our Products</span>
          <h2 className="section-title">Handpicked Quality Spices & Oil</h2>
          <p className="section-subtitle">
            Every product is crafted with care, using traditional methods passed down through generations.
          </p>

          <div className={styles.productGrid}>
            {products.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>

          <div className={styles.sectionCta}>
            <Link href="/products" className={styles.viewAllBtn}>
              View All Products
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services Section ── */}
      <section className={`section ${styles.servicesSection}`}>
        <div className="container">
          <span className="section-accent">Our Services</span>
          <h2 className="section-title">Traditional Milling Services</h2>
          <p className="section-subtitle">
            Bring your own grains, seeds, or rice — we mill them fresh using time-honoured techniques.
          </p>

          <div className={styles.serviceGrid}>
            {services.map((service, idx) => (
              <ServiceCard key={service.id} service={service} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className={`section ${styles.whySection}`}>
        <div className="container">
          <span className="section-accent">Why Choose Us</span>
          <h2 className="section-title">The Pandit Difference</h2>
          <p className="section-subtitle">
            What sets us apart from the rest — quality, trust, and tradition.
          </p>

          <div className={styles.whyGrid}>
            {[
              { icon: '🌾', title: 'Farm Fresh', desc: 'Directly sourced from farmers. No middlemen, no adulteration.' },
              { icon: '⚙️', title: 'Traditional Process', desc: 'Stone-ground and cold-pressed using methods perfected over decades.' },
              { icon: '🧪', title: 'Lab Tested', desc: 'Every batch tested for purity, quality, and consistency.' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Quick delivery to your doorstep. Fresh products, always on time.' },
              { icon: '💰', title: 'Fair Pricing', desc: 'Honest prices without compromising on quality. Value for money.' },
              { icon: '🤝', title: 'Customer First', desc: 'Your satisfaction is our priority. Easy returns and support.' },
            ].map((item, idx) => (
              <div key={idx} className={styles.whyCard}>
                <span className={styles.whyIcon}>{item.icon}</span>
                <h3 className={styles.whyTitle}>{item.title}</h3>
                <p className={styles.whyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Callback CTA Section ── */}
      <section className={`section ${styles.ctaSection}`}>
        <div className={`${styles.ctaContent} container`}>
          <div className={styles.ctaLeft}>
            <span className="section-accent" style={{ color: 'var(--color-secondary)' }}>Get In Touch</span>
            <h2 className={styles.ctaTitle}>Need Help? Request a Callback</h2>
            <p className={styles.ctaDesc}>
              Have questions about our products or services? Leave your details and
              we&apos;ll call you back within 30 minutes during business hours.
            </p>

            <div className={styles.ctaFeatures}>
              <div className={styles.ctaFeature}>
                <span>✅</span> No login required
              </div>
              <div className={styles.ctaFeature}>
                <span>✅</span> Quick response time
              </div>
              <div className={styles.ctaFeature}>
                <span>✅</span> Expert guidance
              </div>
            </div>
          </div>

          <form className={styles.ctaForm} onSubmit={handleCallbackSubmit}>
            {callbackSubmitted ? (
              <div className={styles.ctaSuccess}>
                <span className={styles.ctaSuccessIcon}>🎉</span>
                <h3>Request Received!</h3>
                <p>We&apos;ll call you back shortly.</p>
              </div>
            ) : (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="callback-name">Your Name</label>
                  <input
                    id="callback-name"
                    type="text"
                    placeholder="Enter your name"
                    value={callbackForm.name}
                    onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="callback-phone">Phone Number</label>
                  <input
                    id="callback-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={callbackForm.phone}
                    onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="callback-message">Message (Optional)</label>
                  <textarea
                    id="callback-message"
                    placeholder="Tell us what you need..."
                    rows={3}
                    value={callbackForm.message}
                    onChange={(e) => setCallbackForm({ ...callbackForm, message: e.target.value })}
                  />
                </div>
                <button type="submit" className={styles.ctaSubmitBtn}>
                  Request Callback
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
