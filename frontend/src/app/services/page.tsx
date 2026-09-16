'use client';

import React, { useState, useEffect, useRef } from 'react';
import { services } from '@/data';
import ServiceCard from '@/components/services/ServiceCard';
import styles from './page.module.css';

const serviceWords = [
  'Mustard Oil Milling',
  'Flour Milling',
  'Poha Milling',
  'Traditional Grinding',
  'Custom Processing',
];

export default function ServicesPage() {
  const [activeWord, setActiveWord] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Main hero typing animation
  useEffect(() => {
    const currentWord = serviceWords[activeWord];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (charIndex < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 70);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 35);
      } else {
        setIsDeleting(false);
        setActiveWord((prev) => (prev + 1) % serviceWords.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, activeWord]);

  return (
    <div className={styles.page}>
      {/* Hero Section with Animated Text */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={`${styles.heroContent} container`}>
          <span className={styles.heroBadge}>
            <span className={styles.heroBadgePulse} />
            Our Milling Services
          </span>

          <h1 className={styles.heroTitle}>
            We Offer
            <br />
            <span className={styles.typingLine}>
              <span className={styles.typingText}>{displayedText}</span>
              <span className={styles.typingCursor} />
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            Bring your own grains, seeds, or rice — we transform them into fresh, pure products
            using traditional methods passed down through generations.
          </p>
        </div>

        {/* Scrolling marquee */}
        <div className={styles.marqueeWrapper}>
          <div className={styles.marquee} ref={marqueeRef}>
            {[...serviceWords, ...serviceWords, ...serviceWords].map((word, idx) => (
              <span key={idx} className={styles.marqueeItem}>
                <span className={styles.marqueeIcon}>⚙️</span>
                {word}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Services Process Steps */}
      <section className={`section ${styles.processSection}`}>
        <div className="container">
          <span className="section-accent">How It Works</span>
          <h2 className="section-title">Simple 4-Step Process</h2>
          <p className="section-subtitle">Getting your milling done is easy and hassle-free</p>

          <div className={styles.processGrid}>
            {[
              { step: '01', icon: '📞', title: 'Contact Us', desc: 'Call us or visit our mill with your raw materials.' },
              { step: '02', icon: '⚖️', title: 'Weigh & Inspect', desc: 'We weigh your material and check quality.' },
              { step: '03', icon: '⚙️', title: 'Fresh Milling', desc: 'Your material is processed fresh using traditional methods.' },
              { step: '04', icon: '📦', title: 'Collect & Pay', desc: 'Collect your fresh product and pay the milling rate.' },
            ].map((item, idx) => (
              <div key={idx} className={styles.processCard}>
                <div className={styles.processStep}>{item.step}</div>
                <span className={styles.processIcon}>{item.icon}</span>
                <h3 className={styles.processCardTitle}>{item.title}</h3>
                <p className={styles.processCardDesc}>{item.desc}</p>
                {idx < 3 && <div className={styles.processConnector} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className={`section ${styles.cardsSection}`}>
        <div className="container">
          <span className="section-accent">Our Services</span>
          <h2 className="section-title">Available Milling Services</h2>
          <p className="section-subtitle">
            Each service uses time-tested traditional techniques for the best results.
          </p>

          <div className={styles.serviceGrid}>
            {services.map((service, idx) => (
              <ServiceCard key={service.id} service={service} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`section ${styles.ctaSection}`}>
        <div className={`${styles.ctaContent} container`}>
          <div className={styles.ctaIcon}>🌾</div>
          <h2 className={styles.ctaTitle}>Ready to Get Your Milling Done?</h2>
          <p className={styles.ctaDesc}>
            Visit us with your raw materials or call us to schedule your milling appointment.
            No registration required!
          </p>
          <div className={styles.ctaActions}>
            <a href="/contact" className={styles.ctaPrimaryBtn}>
              Request Callback
            </a>
            <a href="tel:+919934787476" className={styles.ctaSecondaryBtn}>
              📞 Call Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
