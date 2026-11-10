import type { Metadata } from 'next';
import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import FeaturedProducts from './_components/FeaturedProducts';
import MillRatesTicker from './_components/MillRatesTicker';
import CategoryTiles from './_components/CategoryTiles';
import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const faqs = [
  {
    q: 'Is your mustard oil really cold-pressed (Kachi Ghani)?',
    a: 'Yes. Our mustard oil is extracted in a traditional kohlu below 38°C with no heat, chemicals, solvents or blending, so it keeps its natural pungency, aroma and nutrients.',
  },
  {
    q: 'Can I bring my own mustard seeds, wheat or spices for milling?',
    a: 'Yes. Bring your harvest to our mill at Vaishali Bus Stand Road, Lalganj. We weigh it on Govt-stamped digital scales and mill it in front of you. You keep the pure oil and the oil cake (khali).',
  },
  {
    q: 'How do I pay for an online order?',
    a: 'Add products to your cart, place the order and pay instantly via any UPI app. Upload the payment screenshot and we prepare your order for pickup.',
  },
  {
    q: 'What are your mill timings?',
    a: 'The mill is open every day, Monday to Sunday, from 8:00 AM to 9:00 PM. Call +91 99347 87476 for live rates.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const {
  props: { srcSet: heroDesktopSrcSet, ...heroImgProps },
} = getImageProps({
  src: '/images/hero-banner.jpg',
  alt: 'Freshly cold-pressed mustard oil and stone-ground spices at New Pandit Mill',
  fill: true,
  sizes: '50vw',
  loading: 'eager',
  fetchPriority: 'high',
});

// Short, scannable assurances (in place of long "pillars" and certificate cards)
const assurances = [
  { icon: 'oil_barrel', title: 'Cold-pressed', sub: 'Below 38°C' },
  { icon: 'grain', title: 'Stone-ground', sub: 'Milled daily' },
  { icon: 'health_and_safety', title: 'FSSAI certified', sub: '0% adulteration' },
  { icon: 'scale', title: 'Govt. stamped', sub: 'Honest weights' },
];

const testimonials = [
  {
    quote: 'Using their Kali Sarson Tel and Besan for 12 years — the aroma in our kachoris is unmatched.',
    name: 'Radhe Shyam',
    role: 'Sweet shop owner',
  },
  {
    quote: 'They mill my mustard in front of me in 45 minutes, and the weight slip matches exactly.',
    name: 'Manoj Tyagi',
    role: 'Farmer',
  },
  {
    quote: 'Freshly milled turmeric and chilli taste nothing like packet spices.',
    name: 'Sunita Devi',
    role: 'Home cook',
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Hero: one message, two actions ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>FSSAI certified · Since 1984</span>
            <h1 className={styles.heroTitle}>
              Pure <span className={styles.heroHighlight}>Kachi Ghani</span> Oil &amp; Stone-Ground Spices
            </h1>
            <p className={styles.heroSubtitle}>Fresh from our mill in Lalganj. No chemicals, no blending.</p>
            <div className={styles.heroActions}>
              <Link href="/products" className={styles.heroPrimary}>Shop Now</Link>
              <Link href="/services" className={styles.heroSecondary}>Book Milling</Link>
            </div>
          </div>
          <div className={styles.heroMedia}>
            {/* Desktop-only image that loads with high priority; phones download nothing. */}
            <picture>
              <source media="(min-width: 901px)" srcSet={heroDesktopSrcSet} sizes="50vw" />
              <img {...heroImgProps} src={TRANSPARENT_PIXEL} alt={heroImgProps.alt} className={styles.heroImage} />
            </picture>
          </div>
        </div>
      </section>

      <MillRatesTicker />

      <CategoryTiles />

      <FeaturedProducts />

      {/* ── Assurance strip ── */}
      <section className={styles.section} aria-label="Why buy from us">
        <ul className={styles.assurances}>
          {assurances.map((a) => (
            <li key={a.title} className={styles.assurance}>
              <span className={`material-symbols-outlined ${styles.assuranceIcon}`} aria-hidden="true">{a.icon}</span>
              <span>
                <strong>{a.title}</strong>
                <small>{a.sub}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Milling services promo ── */}
      <section className={styles.section}>
        <Link href="/services" className={styles.promo}>
          <div className={styles.promoImage}>
            <Image src="/images/flour-milling.jpg" alt="" fill sizes="(max-width: 640px) 120px, 240px" />
          </div>
          <div className={styles.promoText}>
            <span className={styles.eyebrow}>Bring your own harvest</span>
            <h2 className={styles.promoTitle}>Oil expelling, atta chakki &amp; spice grinding</h2>
            <span className={styles.promoLink}>
              See rates &amp; book
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </span>
          </div>
        </Link>
      </section>

      {/* ── Reviews ── */}
      <section className={styles.section} aria-labelledby="reviews-heading">
        <div className={styles.sectionHeader}>
          <h2 id="reviews-heading" className={styles.sectionTitle}>What customers say</h2>
          <span className={styles.rating}>
            <span className="material-symbols-outlined icon-filled" aria-hidden="true">star</span>
            4.9
          </span>
        </div>
        <div className={styles.reviewRail}>
          {testimonials.map((t) => (
            <figure key={t.name} className={styles.review}>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <strong>{t.name}</strong> · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ (collapsed) ── */}
      <section className={styles.section} aria-labelledby="faq-heading">
        <div className={styles.sectionHeader}>
          <h2 id="faq-heading" className={styles.sectionTitle}>Questions</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((f) => (
            <details key={f.q} className={styles.faqItem}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Bulk orders ── */}
      <section className={`${styles.section} ${styles.sectionLast}`}>
        <div className={styles.bulk}>
          <div>
            <h2 className={styles.bulkTitle}>Bulk or wholesale order?</h2>
            <p className={styles.bulkText}>Weddings, caterers and 15L tins — talk to the mill directly.</p>
          </div>
          <div className={styles.bulkActions}>
            <a href="tel:+919934787476" className={styles.bulkCall}>
              <span className="material-symbols-outlined" aria-hidden="true">call</span>
              Call
            </a>
            <a href="https://wa.me/919934787476" target="_blank" rel="noopener noreferrer" className={styles.bulkChat}>
              <span className="material-symbols-outlined" aria-hidden="true">chat</span>
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
