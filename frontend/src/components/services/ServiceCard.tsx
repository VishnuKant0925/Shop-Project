'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Service } from '@/types';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  service: Service;
  index?: number;
}

export default function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Typing animation for features
  useEffect(() => {
    if (!isVisible) return;

    const feature = service.features[currentFeatureIndex];
    let charIndex = 0;
    setIsTyping(true);
    setTypedText('');

    // Typing phase
    const typeInterval = setInterval(() => {
      if (charIndex <= feature.length) {
        setTypedText(feature.substring(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);

        // Pause, then erase
        setTimeout(() => {
          let eraseIndex = feature.length;
          setIsTyping(true);

          const eraseInterval = setInterval(() => {
            if (eraseIndex >= 0) {
              setTypedText(feature.substring(0, eraseIndex));
              eraseIndex--;
            } else {
              clearInterval(eraseInterval);
              setIsTyping(false);
              setCurrentFeatureIndex((prev) => (prev + 1) % service.features.length);
            }
          }, 30);
        }, 2000);
      }
    }, 60);

    return () => clearInterval(typeInterval);
  }, [isVisible, currentFeatureIndex, service.features]);

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isVisible ? styles.visible : ''}`}
      style={{ animationDelay: `${index * 200}ms` }}
    >
      <div className={styles.cardInner}>
        {/* Front side - visual */}
        <div className={styles.imageSection}>
          <Image
            src={service.imageUrl}
            alt={service.name}
            width={600}
            height={400}
            className={styles.image}
          />
          <div className={styles.imageGradient} />
          <div className={styles.iconFloat}>
            <span className={styles.icon}>{service.icon}</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.name}>{service.name}</h3>
          <p className={styles.description}>{service.description}</p>

          {/* Typing animation section */}
          <div className={styles.typingSection}>
            <span className={styles.typingLabel}>Features:</span>
            <div className={styles.typingBox}>
              <span className={styles.typingText}>
                {typedText}
                <span className={`${styles.cursor} ${isTyping ? styles.cursorBlink : ''}`}>|</span>
              </span>
            </div>
          </div>

          {/* Feature pills */}
          <div className={styles.features}>
            {service.features.map((feature, idx) => (
              <span
                key={idx}
                className={`${styles.featurePill} ${idx === currentFeatureIndex ? styles.featurePillActive : ''}`}
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Rate */}
          <div className={styles.rateSection}>
            <div className={styles.rate}>
              <span className={styles.rateSymbol}>₹</span>
              <span className={styles.rateValue}>{service.rate}</span>
              <span className={styles.rateUnit}>{service.rateUnit}</span>
            </div>
            <a href="/contact" className={styles.ctaBtn}>
              <span>Get Service</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Animated border glow */}
      <div className={styles.glowBorder} />
    </div>
  );
}
