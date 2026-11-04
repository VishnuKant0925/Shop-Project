import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import YieldCalculator from './_components/YieldCalculator';
import FeaturedProducts from './_components/FeaturedProducts';
import MillRatesTicker from './_components/MillRatesTicker';
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
    a: 'Add products to your cart, place the order and pay instantly via any UPI app by scanning our QR code. Upload the payment screenshot and we prepare your order for pickup.',
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

const pillars = [
  {
    icon: 'oil_barrel',
    title: 'Kohlu Cold-Press <38°C',
    desc: 'Slow cold extraction ensures active pungency, authentic aroma, and essential Omega-3 natural nutrients stay alive.',
    color: 'primary',
  },
  {
    icon: 'handyman',
    title: 'Slow Stone Grinding',
    desc: 'Heavy granite wheels mill whole spices at cool temperatures to prevent burning essential oils or aroma.',
    color: 'secondary',
  },
  {
    icon: 'verified_user',
    title: '0% Chemical / Argemone',
    desc: 'Zero synthetic dyes, zero palm/rice bran blends. Every batch is certified safe under strict FSSAI standards.',
    color: 'amber',
  },
  {
    icon: 'scale',
    title: 'Govt. Verified Digital Tare',
    desc: 'Govt-stamped scales ensure every gram of your seed is tracked with transparent yield weight slips.',
    color: 'stone',
  },
];

const testimonials = [
  {
    quote: '"We run a traditional sweet shop and have relied on New Pandit\'s Kali Sarson Tel and Besan for 12 years. The purity and aroma in our kachoris is completely distinct."',
    name: 'Radhe Shyam Halwai',
    role: 'Bikaner Sweets • Commercial Partner',
    initial: 'R',
  },
  {
    quote: '"Every harvest I bring 3 quintals of mustard from our fields. Pandit ji mills it before my eyes in 45 minutes. The digital scale slip matches my weight exactly."',
    name: 'Manoj Tyagi',
    role: 'Farmer • Custom Expelling User',
    initial: 'M',
  },
  {
    quote: '"The aroma of their slow-ground Salem Turmeric and Teja Chilli is incomparable to packet spices. Freshly milled spices make home cooking truly healthy."',
    name: 'Sunita Devi',
    role: 'Monthly Retail Customer',
    initial: 'S',
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.gatewayBadge}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '15px' }}>verified</span>
              FSSAI Certified • Since 1984
            </span>
            <h1 className={styles.heroTitle}>
              Pure <span className={styles.heroHighlight}>Kachi Ghani</span> Mustard Oil &amp; Stone-Ground Spices
            </h1>
            <p className={styles.heroSubtitle}>
              Freshly cold-pressed oil and slow-milled turmeric, chilli and coriander from our mill in Lalganj, Vaishali.
              Zero chemicals, zero blending — straight from the mill to your kitchen.
            </p>
            <div className={styles.heroActions}>
              <Link href="/products" className={styles.heroPrimary}>
                <span className="material-symbols-outlined" aria-hidden="true">storefront</span>
                Shop Now
              </Link>
              <Link href="/services" className={styles.heroSecondary}>
                Book Milling
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>
            <ul className={styles.heroTrust}>
              <li>
                <span className="material-symbols-outlined icon-filled" aria-hidden="true">star</span>
                <strong>4.9</strong> rated
              </li>
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                0% adulteration
              </li>
              <li>
                <span className="material-symbols-outlined" aria-hidden="true">scale</span>
                Govt. stamped scales
              </li>
            </ul>
          </div>
          <div className={styles.heroMedia}>
            <div className={styles.heroImageWrap}>
              <Image
                src="/images/hero-banner.jpg"
                alt="Freshly cold-pressed mustard oil and stone-ground spices at New Pandit Mill"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 900px) 100vw, 50vw"
                className={styles.heroImage}
              />
            </div>
            <div className={`${styles.heroFloat} ${styles.heroFloatTop}`}>
              <span className={styles.heroFloatIcon} aria-hidden="true">🫙</span>
              <span>
                <strong>Cold-pressed</strong>
                <small>below 38°C</small>
              </span>
            </div>
            <div className={`${styles.heroFloat} ${styles.heroFloatBottom}`}>
              <span className={styles.heroFloatIcon} aria-hidden="true">🌶️</span>
              <span>
                <strong>Milled daily</strong>
                <small>on stone chakki</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mandi Rates Ticker ── */}
      <MillRatesTicker />

      <FeaturedProducts />

      {/* ── Dual Gateway Section ── */}
      <section className={styles.gateway}>
        <div className={styles.gatewayHeader}>
          <span className={styles.gatewayBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
            Shop or Mill With Us
          </span>
          <h2 className={styles.gatewayTitle}>How Can We Serve You Today?</h2>
          <p className={styles.gatewaySubtitle}>
            Choose your journey: Order freshly packaged 100% pure cold-pressed goods, or book custom stone-grinding and oil extraction slots for your own produce.
          </p>
        </div>

        <div className={styles.gatewayCards}>
          {/* Card 1: Products */}
          <div className={styles.gatewayCard}>
            <div className={styles.gatewayCardImage}>
              <Image
                src="/images/mustard-oil.jpg"
                alt="Cold-pressed mustard oil bottles from New Pandit Mill"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.gatewayCardImg}
              />
              <div className={styles.gatewayCardBadges}>
                <span className={styles.gatewayCardBadge}>Direct Mill Store</span>
                <span className={styles.gatewayCardBadgeAccent}>100% Pure</span>
              </div>
            </div>
            <div className={styles.gatewayCardContent}>
              <div className={styles.gatewayCardTitleRow}>
                <h3 className={styles.gatewayCardTitle}>Products We Sell</h3>
                <span className={styles.statusPill}>Ready to Ship</span>
              </div>
              <p className={styles.gatewayCardDesc}>
                Wholesome nutrition uncompromised by chemicals, industrial solvents, or high heat. Freshly expelled and stone-ground every morning.
              </p>
              <ul className={styles.gatewayFeatures}>
                <li>
                  <span className={styles.featureIcon}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>water_drop</span>
                  </span>
                  <div>
                    <strong>Cold-Pressed Mustard &amp; Sesame Oils</strong>
                    <p>Traditional wooden kohlu, low-temperature pungency</p>
                  </div>
                </li>
                <li>
                  <span className={styles.featureIcon}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>spa</span>
                  </span>
                  <div>
                    <strong>Slow Stone-Ground Spices</strong>
                    <p>Salem Turmeric, Teja Mirch, Coriander &amp; Cumin</p>
                  </div>
                </li>
                <li>
                  <span className={styles.featureIcon}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grain</span>
                  </span>
                  <div>
                    <strong>Crisp Poha, Chakki Atta &amp; Sattu</strong>
                    <p>Rolled fresh daily from harvest-quality grains</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.gatewayCardCTA}>
              <Link href="/products" className={styles.ctaPrimary}>
                Explore Storefront
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Services */}
          <div className={`${styles.gatewayCard} ${styles.gatewayCardSecondary}`}>
            <div className={styles.gatewayCardImage}>
              <Image
                src="/images/flour-milling.jpg"
                alt="Stone chakki flour milling service"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.gatewayCardImg}
              />
              <div className={styles.gatewayCardBadges}>
                <span className={`${styles.gatewayCardBadge} ${styles.badgeSecondary}`}>Processing Hub</span>
                <span className={styles.gatewayCardBadgeDark}>Zero Waste</span>
              </div>
            </div>
            <div className={styles.gatewayCardContent}>
              <div className={styles.gatewayCardTitleRow}>
                <h3 className={styles.gatewayCardTitle}>Services We Provide</h3>
                <span className={`${styles.statusPill} ${styles.statusPillSecondary}`}>Bring Your Harvest</span>
              </div>
              <p className={styles.gatewayCardDesc}>
                Bring your whole grains or dried spices. Witness live digital weighing, zero-residue cleaning, and slow low-RPM processing directly into your containers.
              </p>
              <ul className={styles.gatewayFeatures}>
                <li>
                  <span className={`${styles.featureIcon} ${styles.featureIconSecondary}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_vintage</span>
                  </span>
                  <div>
                    <strong>Custom Mustard &amp; Sesame Oil Expelling</strong>
                    <p>Keep 100% pure oil + fresh high-protein oil cake (Khali)</p>
                  </div>
                </li>
                <li>
                  <span className={`${styles.featureIcon} ${styles.featureIconSecondary}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_fire_department</span>
                  </span>
                  <div>
                    <strong>Low-Heat Whole Spices Stone Grinding</strong>
                    <p>Preserves natural essential oils without scorching</p>
                  </div>
                </li>
                <li>
                  <span className={`${styles.featureIcon} ${styles.featureIconSecondary}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>scale</span>
                  </span>
                  <div>
                    <strong>Chakki Atta, Besan &amp; Chura / Poha Roasting</strong>
                    <p>Batch calibrated for households, halwais, and canteens</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.gatewayCardCTA}>
              <Link href="/services" className={styles.ctaSecondary}>
                Book Milling Slot
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Pillars of Purity ── */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarsInner}>
          <div className={styles.pillarsHeader}>
            <span className={styles.pillarsAccent}>Uncompromised Authenticity</span>
            <h2 className={styles.pillarsTitle}>The 4 Pillars of Pandit Mill Purity</h2>
            <p className={styles.pillarsSubtitle}>
              In a market flooded with blended and chemically bleached oils, we adhere strictly to generational methods.
            </p>
          </div>
          <div className={styles.pillarsGrid}>
            {pillars.map((pillar, i) => (
              <div key={i} className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{pillar.icon}</span>
                </div>
                <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                <p className={styles.pillarDesc}>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seed-to-Oil Yield Calculator ── */}
      <section className={styles.calculatorSection}>
        <div className={styles.calculatorGrid}>
          <div className={styles.calculatorLeft}>
            <span className={styles.calcAccent}>Smart Estimator</span>
            <h2 className={styles.calcTitle}>Quick Seed-to-Oil Yield Calculator</h2>
            <p className={styles.calcDesc}>
              Planning to bring your harvest? Select your mustard seed batch size to calculate expected cold-pressed oil and cattle-feed cake yield:
            </p>

            <YieldCalculator />
          </div>
          <div className={styles.calculatorRight}>
            <div className={styles.calcImgWrapper}>
              <Image
                src="/images/mustard-oil.jpg"
                alt="Cold pressed mustard oil"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.calcImg}
              />
            </div>
            <div className={styles.calcImgWrapper}>
              <Image
                src="/images/red-chili-powder.jpg"
                alt="Stone ground chillies"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.calcImg}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Government Certifications ── */}
      <section className={styles.certsSection}>
        <div className={styles.certsHeader}>
          <span className={styles.certsBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
            Government Compliance &amp; Legal Accreditations
          </span>
          <h2 className={styles.certsTitle}>100% Certified, Regulated &amp; Honest Operations</h2>
          <p className={styles.certsSubtitle}>
            Every drop of oil expelled, spice milled, and kilogram weighed is strictly certified under Central Food Safety and Legal Metrology standards.
          </p>
        </div>
        <div className={styles.certsGrid}>
          {/* FSSAI */}
          <div className={styles.certCard}>
            <div className={styles.certCardHeader}>
              <span className={styles.certLicenseBadge}>
                <span className={styles.certDot}></span>
                FSSAI #10023948000122
              </span>
              <span className={styles.certStatus}>Active • Grade &apos;A&apos;</span>
            </div>
            <div className={`${styles.certIconBox}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>health_and_safety</span>
            </div>
            <h3 className={styles.certTitle}>Food Safety and Standards Authority of India</h3>
            <div className={styles.certDetails}>
              <p><strong>Categories:</strong> Cat. 02 (Fats &amp; Oils) &amp; Cat. 04 (Spices &amp; Chakki Milling)</p>
              <p>Zero mineral oil, zero chemical bleaching, unadulterated edible oil processing certified with annual safety audit.</p>
            </div>
            <div className={styles.certCTAWrapper}>
              <Link href="/contact" className={styles.certCTA}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                Request Certificate
              </Link>
            </div>
          </div>

          {/* Legal Metrology */}
          <div className={styles.certCard}>
            <div className={styles.certCardHeader}>
              <span className={`${styles.certLicenseBadge} ${styles.certLicenseBadgeSecondary}`}>
                <span className={styles.certDot}></span>
                DLM #DLM/UP/2024/WT-8841
              </span>
              <span className={`${styles.certStatus} ${styles.certStatusSecondary}`}>Valid Nov 2025</span>
            </div>
            <div className={`${styles.certIconBox} ${styles.certIconBoxSecondary}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>scale</span>
            </div>
            <h3 className={styles.certTitle}>Dept. of Legal Metrology Govt. Stamped Scales</h3>
            <div className={styles.certDetails}>
              <p><strong>Inspection:</strong> Annual physical verification &amp; electronic tamper-seal stamping.</p>
              <p>True zero-tare digital load cells. Printed digital weigh-bridge slips provided with every farmer or retail bag.</p>
            </div>
            <div className={styles.certCTAWrapper}>
              <Link href="/contact" className={`${styles.certCTA} ${styles.certCTASecondary}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                Request Scale Verification
              </Link>
            </div>
          </div>

          {/* Agmark */}
          <div className={styles.certCard}>
            <div className={styles.certCardHeader}>
              <span className={`${styles.certLicenseBadge} ${styles.certLicenseBadgeAmber}`}>
                <span className={styles.certDot}></span>
                AGMARK #AG-77291-B
              </span>
              <span className={`${styles.certStatus} ${styles.certStatusAmber}`}>Grade-1 Standard</span>
            </div>
            <div className={`${styles.certIconBox} ${styles.certIconBoxAmber}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>science</span>
            </div>
            <h3 className={styles.certTitle}>National Quality Agmark Standardization</h3>
            <div className={styles.certDetails}>
              <p><strong>Compliance:</strong> FSSAI Regulation 2.2.1 compliant.</p>
              <p>Batch-tested for 0% Argemone oil, zero synthetic colorants in chili &amp; turmeric, raw moisture &lt;8.5%.</p>
            </div>
            <div className={styles.certCTAWrapper}>
              <Link href="/contact" className={`${styles.certCTA} ${styles.certCTAAmber}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fact_check</span>
                Request Batch Lab Report
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={styles.testimonialsSection}>
        <div className={styles.testimonialsInner}>
          <div className={styles.testimonialsHeader}>
            <div>
              <span className={styles.testimonialsAccent}>Community Trust</span>
              <h2 className={styles.testimonialsTitle}>Words from Homes &amp; Sweetmakers</h2>
            </div>
            <div className={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined icon-filled" aria-hidden="true" style={{ fontSize: '18px', color: 'var(--color-star)' }}>star</span>
              ))}
              <span className={styles.ratingText}>4.9 / 5 (3,280+ Reviews)</span>
            </div>
          </div>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <p className={styles.testimonialQuote}>{t.quote}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar} aria-hidden="true">
                    {t.initial}
                  </div>
                  <div>
                    <strong className={styles.testimonialName}>{t.name}</strong>
                    <span className={styles.testimonialRole}>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <div className={styles.faqInner}>
          <span className={styles.pillarsAccent}>Good To Know</span>
          <h2 id="faq-heading" className={styles.pillarsTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {faqs.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bulk CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerContent}>
          <div className={styles.ctaBannerText}>
            <span className={styles.ctaBannerLabel}>Direct Mill Inquiries &amp; 15L Tins</span>
            <h2 className={styles.ctaBannerTitle}>Need Bulk Wholesale or Custom Grinding?</h2>
            <p className={styles.ctaBannerDesc}>
              For weddings, catering contracts, or 50+ quintal harvest milling, call our mill floor directly.
            </p>
          </div>
          <div className={styles.ctaBannerActions}>
            <a href="tel:+919934787476" className={styles.ctaBannerPhone}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>phone</span>
              +91 9934787476
            </a>
            <a href="https://wa.me/919934787476" target="_blank" rel="noopener noreferrer" className={styles.ctaBannerWhatsApp}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
              WhatsApp Mill
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
