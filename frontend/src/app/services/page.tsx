import type { Metadata } from 'next';
import { services as fallbackServices } from '@/data';
import { getActiveServices } from '@/lib/serverApi';
import ServiceCard from '@/components/services/ServiceCard';
import YieldCalculator from './YieldCalculator';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Mustard Oil Expelling, Atta Chakki & Poha Milling Services',
  description:
    'Bring your own mustard seeds, wheat, spices or rice to New Pandit Mill, Lalganj. Cold-press oil expelling, stone chakki atta, spice grinding and poha milling at fair per-kg rates.',
  alternates: { canonical: '/services' },
};

const steps = [
  { title: 'Bring your harvest', desc: 'Visit the mill or call ahead' },
  { title: 'Weigh it', desc: 'On Govt-stamped scales' },
  { title: 'We mill it', desc: 'Fresh, in front of you' },
  { title: 'Collect & pay', desc: 'Pay only the milling rate' },
];

export default async function ServicesPage() {
  // Admin-managed services; the built-in list is only used if the API is unreachable.
  const fromApi = await getActiveServices();
  const services = fromApi.length > 0 ? fromApi : fallbackServices;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Milling Services</h1>
          <p className={styles.subtitle}>Bring your own seeds, grain or spices — we process them fresh at fair per-kg rates.</p>
        </div>
      </header>

      <section className="container" aria-label="Services and rates">
        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className={`container ${styles.block}`} aria-labelledby="how-heading">
        <h2 id="how-heading" className={styles.blockTitle}>How it works</h2>
        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span>
                <strong>{s.title}</strong>
                <small>{s.desc}</small>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={`container ${styles.block}`} aria-labelledby="calc-heading">
        <h2 id="calc-heading" className={styles.blockTitle}>Mustard oil yield estimate</h2>
        <YieldCalculator />
      </section>

      <section className={`container ${styles.block}`}>
        <div className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>Want to book a slot?</h2>
            <p className={styles.ctaText}>No registration needed — just call or walk in.</p>
          </div>
          <div className={styles.ctaActions}>
            <a href="tel:+919934787476" className={styles.ctaPrimary}>
              <span className="material-symbols-outlined" aria-hidden="true">call</span>
              Call mill
            </a>
            <a href="https://wa.me/919934787476" target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>
              <span className="material-symbols-outlined" aria-hidden="true">chat</span>
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
