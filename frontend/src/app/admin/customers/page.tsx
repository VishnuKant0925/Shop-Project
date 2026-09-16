'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, CustomerSummary, CustomerDetail, PromotionPayload } from '@/lib/api';
import styles from './page.module.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (isoString: string): string => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimeAgo = (dateStr: string): string => {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  paid: { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  preparing: { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  ready: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A' },
  completed: { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
};

const emailPresets = [
  {
    id: 'harvest15',
    title: '🌾 Festive Harvest Scheme (15% OFF)',
    subject: 'Special Festive Scheme: 15% OFF on Pure Cold-Pressed Oils & Stone-Ground Spices! 🌶️',
    headline: 'Celebrate With Pure, Unadulterated Mill Goodness',
    offerCode: 'PANDIT15',
    discountText: '15% Flat Discount on orders above ₹499',
    message: `Dear Valued Patron,\n\nWe are delighted to introduce our seasonal festive discount scheme. Every batch of our Kachi Ghani Mustard Oil is pressed in slow wooden-style expellers, and our turmeric, coriander, and red chili are freshly stone-milled to retain 100% natural aroma.\n\nUse your scheme code during online checkout or mention it when visiting our mill in Lalganj!`,
    ctaText: 'Shop Pure Products Online →',
    ctaUrl: 'http://localhost:3000/products',
  },
  {
    id: 'chakki_free',
    title: '⚙️ Custom Milling Scheme (Free 5kg)',
    subject: 'Special Milling Offer: Free 5kg Chakki Processing / Poha Rolling 🌾',
    headline: 'Experience Stone-Ground Chakki Milling at New Pandit Mill',
    offerCode: 'CHAKKI5KG',
    discountText: 'Free 5kg Milling on orders above 20kg grain',
    message: `Dear Valued Customer,\n\nBring your farm-harvested wheat, paddy, or mustard seeds directly to New Pandit Mill Yard (Vaishali Bus Stand Road, Lalganj).\n\nWe guarantee high yield, cool stone processing, and zero mix-ups. Show this email to our mill manager for your complimentary trial!`,
    ctaText: 'View Mill Services & Rates →',
    ctaUrl: 'http://localhost:3000/services',
  },
  {
    id: 'loyalty100',
    title: '🎁 VIP Patron Rebate (₹100 OFF)',
    subject: 'A Thank You Voucher from New Pandit Mill: Flat ₹100 OFF 🎁',
    headline: 'Special Loyalty Reward Just For You',
    offerCode: 'LOYALTY100',
    discountText: 'Flat ₹100 Instant Discount',
    message: `Dear Valued Patron,\n\nThank you for choosing New Pandit Masala & Tel Mill as your household source for pure essentials. To show our gratitude, here is a special ₹100 gift voucher for your next purchase.\n\nApplicable on all cold-pressed oils, spice powders, and rolled poha.`,
    ctaText: 'Claim Your ₹100 Voucher Now →',
    ctaUrl: 'http://localhost:3000/products',
  },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalSpend: 0,
    repeatCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Order history drawer state
  const [historyCustomer, setHistoryCustomer] = useState<CustomerDetail | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Email composer modal state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerData, setComposerData] = useState<PromotionPayload>({
    recipientType: 'all',
    recipientEmails: [],
    subject: emailPresets[0].subject,
    headline: emailPresets[0].headline,
    offerCode: emailPresets[0].offerCode,
    discountText: emailPresets[0].discountText,
    message: emailPresets[0].message,
    ctaUrl: emailPresets[0].ctaUrl,
    ctaText: emailPresets[0].ctaText,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchCustomers = useCallback(async (query = '') => {
    try {
      const res = await api.getCustomers(query);
      setCustomers(res.data);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [fetchCustomers, searchQuery]);

  // View order history
  const handleViewHistory = async (customerId: string) => {
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const detail = await api.getCustomerDetails(customerId);
      setHistoryCustomer(detail);
    } catch (err) {
      console.error('Failed to load customer details', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open composer for a single customer
  const handleOpenSingleComposer = (email: string) => {
    setComposerData((prev) => ({
      ...prev,
      recipientType: 'individual',
      recipientEmails: [email],
    }));
    setSendResult(null);
    setComposerOpen(true);
  };

  // Open composer for selected customers
  const handleOpenSelectedComposer = () => {
    setComposerData((prev) => ({
      ...prev,
      recipientType: 'selected',
      recipientEmails: [...selectedEmails],
    }));
    setSendResult(null);
    setComposerOpen(true);
  };

  // Open composer for all customers
  const handleOpenBroadcastComposer = () => {
    setComposerData((prev) => ({
      ...prev,
      recipientType: 'all',
      recipientEmails: [],
    }));
    setSendResult(null);
    setComposerOpen(true);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = emailPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setComposerData((prev) => ({
      ...prev,
      subject: preset.subject,
      headline: preset.headline,
      offerCode: preset.offerCode,
      discountText: preset.discountText,
      message: preset.message,
      ctaUrl: preset.ctaUrl,
      ctaText: preset.ctaText,
    }));
  };

  // Handle select all / toggle single
  const handleToggleSelectAll = () => {
    if (selectedEmails.length === customers.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(customers.map((c) => c.email));
    }
  };

  const handleToggleSelectOne = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  // Send promotional email
  const handleSendPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.sendCustomerPromotion(composerData);
      setSendResult({
        success: true,
        message: res.message || `Dispatched offers to ${res.sentCount} customers!`,
      });
      setTimeout(() => {
        if (res.success) {
          setComposerOpen(false);
          setSendResult(null);
          setSelectedEmails([]);
        }
      }, 2500);
    } catch (err) {
      setSendResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send emails',
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string): string => {
    return (name || 'C')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>Customer Directory &amp; CRM</h1>
          <p className={styles.subtitle}>
            Manage registered patrons, monitor lifetime purchase activity, and broadcast promotional schemes.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleOpenBroadcastComposer}
            className={styles.broadcastBtn}
          >
            <span>✉️</span>
            <span>Broadcast Offer to All</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.theme_amber}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Patrons</span>
            <span className={styles.statIcon}>👥</span>
          </div>
          <div className={styles.statValue}>{stats.totalCustomers}</div>
          <span className={styles.statSub}>Registered customer accounts</span>
        </div>

        <div className={`${styles.statCard} ${styles.theme_rust}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Lifetime Orders</span>
            <span className={styles.statIcon}>📦</span>
          </div>
          <div className={styles.statValue}>{stats.totalOrders}</div>
          <span className={styles.statSub}>Total orders placed</span>
        </div>

        <div className={`${styles.statCard} ${styles.theme_emerald}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Cumulative Spend</span>
            <span className={styles.statIcon}>💰</span>
          </div>
          <div className={styles.statValue}>{formatCurrency(stats.totalSpend)}</div>
          <span className={styles.statSub}>Direct customer gross value</span>
        </div>

        <div className={`${styles.statCard} ${styles.theme_purple}`}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Repeat Buyers</span>
            <span className={styles.statIcon}>⭐</span>
          </div>
          <div className={styles.statValue}>{stats.repeatCustomers}</div>
          <span className={styles.statSub}>Customers with 2+ orders</span>
        </div>
      </div>

      {/* Directory Section */}
      <div className={styles.tableCard}>
        {/* Controls: Search and Selection Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by customer name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.searchClear}
              >
                ✕
              </button>
            )}
          </div>

          {selectedEmails.length > 0 && (
            <div className={styles.selectionBar}>
              <span className={styles.selectionCount}>
                <strong>{selectedEmails.length}</strong> selected
              </span>
              <button
                type="button"
                onClick={handleOpenSelectedComposer}
                className={styles.targetEmailBtn}
              >
                <span>✉️</span> Send Scheme to Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedEmails([])}
                className={styles.clearSelectionBtn}
              >
                Deselect
              </button>
            </div>
          )}
        </div>

        {/* Customer Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading customer accounts...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: '2.5rem' }}>👥</span>
              <h3>No customers found</h3>
              <p>
                {searchQuery
                  ? `No customer accounts match "${searchQuery}". Try a different name or phone.`
                  : 'No customer accounts registered yet.'}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmails.length === customers.length && customers.length > 0}
                      onChange={handleToggleSelectAll}
                      title="Select all customers"
                    />
                  </th>
                  <th>Customer</th>
                  <th>Contact Details</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const isSelected = selectedEmails.includes(c.email);
                  const lastStatus = c.lastOrderStatus
                    ? statusColors[c.lastOrderStatus] || { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' }
                    : null;

                  return (
                    <tr key={c.id} className={isSelected ? styles.selectedRow : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(c.email)}
                        />
                      </td>
                      <td>
                        <div className={styles.customerCell}>
                          <div className={styles.avatar}>{getInitials(c.name)}</div>
                          <div className={styles.customerMeta}>
                            <strong className={styles.customerName}>{c.name}</strong>
                            <span className={styles.memberSince}>
                              Joined {formatDate(c.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contactCell}>
                          <span className={styles.emailText}>{c.email}</span>
                          <span className={styles.phoneText}>
                            {c.phone || <em style={{ color: '#a8a29e' }}>No phone</em>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.ordersBadge}>
                          <strong>{c.totalOrders}</strong> order{c.totalOrders === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td>
                        <span className={styles.spentAmount}>
                          {formatCurrency(c.totalSpent)}
                        </span>
                      </td>
                      <td>
                        {c.lastOrderDate ? (
                          <div className={styles.lastOrderCell}>
                            <span className={styles.timeAgo}>{formatTimeAgo(c.lastOrderDate)}</span>
                            {lastStatus && (
                              <span
                                className={styles.statusPillSmall}
                                style={{
                                  backgroundColor: lastStatus.bg,
                                  color: lastStatus.text,
                                }}
                              >
                                <span
                                  className={styles.statusDotSmall}
                                  style={{ backgroundColor: lastStatus.dot }}
                                />
                                {c.lastOrderStatus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#a8a29e', fontSize: '0.8rem' }}>No orders</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            onClick={() => handleViewHistory(c.id)}
                            className={styles.historyBtn}
                            title="View full order history"
                          >
                            <span>📜</span> History
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenSingleComposer(c.email)}
                            className={styles.emailBtn}
                            title="Email scheme or offer"
                          >
                            <span>✉️</span> Offer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Order History Slide-over Drawer ── */}
      {historyOpen && (
        <div className={styles.drawerOverlay} onClick={() => setHistoryOpen(false)}>
          <div
            className={styles.drawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <div>
                <h2 className={styles.drawerTitle}>Customer Profile &amp; History</h2>
                <p className={styles.drawerSub}>Complete purchase lifecycle and item receipts</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className={styles.drawerClose}
              >
                ✕
              </button>
            </div>

            {historyLoading || !historyCustomer ? (
              <div className={styles.drawerLoading}>
                <div className={styles.spinner} />
                <p>Retrieving customer history...</p>
              </div>
            ) : (
              <div className={styles.drawerBody}>
                {/* Customer Profile Card */}
                <div className={styles.profileCard}>
                  <div className={styles.profileAvatar}>
                    {getInitials(historyCustomer.customer.name)}
                  </div>
                  <div className={styles.profileDetails}>
                    <h3>{historyCustomer.customer.name}</h3>
                    <p className={styles.profileEmail}>✉️ {historyCustomer.customer.email}</p>
                    <p className={styles.profilePhone}>📞 {historyCustomer.customer.phone || 'No phone registered'}</p>
                    <span className={styles.profileJoined}>
                      Member since {formatDate(historyCustomer.customer.createdAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryOpen(false);
                      handleOpenSingleComposer(historyCustomer.customer.email);
                    }}
                    className={styles.exclusiveOfferBtn}
                  >
                    <span>🎁</span> Send Exclusive Offer
                  </button>
                </div>

                {/* Metrics Pill Grid */}
                <div className={styles.drawerStats}>
                  <div className={styles.drawerStatItem}>
                    <span>Total Orders</span>
                    <strong>{historyCustomer.stats.totalOrders}</strong>
                  </div>
                  <div className={styles.drawerStatItem}>
                    <span>Lifetime Spend</span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {formatCurrency(historyCustomer.stats.totalSpent)}
                    </strong>
                  </div>
                  <div className={styles.drawerStatItem}>
                    <span>Average Value</span>
                    <strong>{formatCurrency(historyCustomer.stats.avgOrderValue)}</strong>
                  </div>
                </div>

                {/* Order History Timeline */}
                <div className={styles.historySection}>
                  <h4 className={styles.historySectionTitle}>
                    Order History ({historyCustomer.orders.length})
                  </h4>

                  {historyCustomer.orders.length === 0 ? (
                    <div className={styles.noOrdersNotice}>
                      <span>🛍️</span>
                      <p>This customer has not placed any orders yet.</p>
                    </div>
                  ) : (
                    <div className={styles.ordersList}>
                      {historyCustomer.orders.map((order) => {
                        const statusConf = statusColors[order.status] || {
                          bg: '#F3F4F6',
                          text: '#374151',
                          dot: '#6B7280',
                        };

                        return (
                          <div key={order.id} className={styles.orderHistoryItem}>
                            <div className={styles.orderItemHeader}>
                              <div>
                                <span className={styles.orderItemNumber}>
                                  {order.orderNumber}
                                </span>
                                <span className={styles.orderItemDate}>
                                  {formatDate(order.createdAt)} • {formatTimeAgo(order.createdAt)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  className={styles.statusBadge}
                                  style={{
                                    backgroundColor: statusConf.bg,
                                    color: statusConf.text,
                                  }}
                                >
                                  <span
                                    className={styles.badgeDot}
                                    style={{ backgroundColor: statusConf.dot }}
                                  />
                                  {order.status}
                                </span>
                                <span className={styles.orderItemTotal}>
                                  {formatCurrency(order.total)}
                                </span>
                              </div>
                            </div>

                            {/* Itemized list */}
                            <div className={styles.orderItemsTable}>
                              {order.items.map((item, idx) => (
                                <div key={idx} className={styles.itemRow}>
                                  <span className={styles.itemName}>{item.productName}</span>
                                  <span className={styles.itemQty}>× {item.quantity}</span>
                                  <span className={styles.itemPrice}>
                                    {formatCurrency(item.totalPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {order.shippingAddress && (
                              <div className={styles.shippingNotice}>
                                📍 <strong>Delivery Address:</strong> {order.shippingAddress}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Promotional Email Composer Modal ── */}
      {composerOpen && (
        <div className={styles.modalBackdrop} onClick={() => setComposerOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Compose Promotional Offer &amp; Scheme</h2>
                <p className={styles.modalSub}>
                  Deliver branded promotional emails directly to customers via Gmail SMTP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>

            {/* Presets Quick Selector */}
            <div className={styles.presetSelector}>
              <span className={styles.presetLabel}>Quick Schemes:</span>
              <div className={styles.presetButtons}>
                {emailPresets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id)}
                    className={styles.presetBtn}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Scope Pill */}
            <div className={styles.recipientBar}>
              <span>Audience Target:</span>
              <strong>
                {composerData.recipientType === 'all' && `All Registered Customers (${customers.length})`}
                {composerData.recipientType === 'selected' &&
                  `Selected Customers (${composerData.recipientEmails?.length || 0})`}
                {composerData.recipientType === 'individual' &&
                  `Individual: ${composerData.recipientEmails?.[0] || '1 customer'}`}
              </strong>
            </div>

            {/* Tab switch: Form vs Live Preview */}
            <div className={styles.tabNav}>
              <button
                type="button"
                className={`${styles.tabBtn} ${!previewMode ? styles.tabBtnActive : ''}`}
                onClick={() => setPreviewMode(false)}
              >
                ✏️ Edit Content
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${previewMode ? styles.tabBtnActive : ''}`}
                onClick={() => setPreviewMode(true)}
              >
                👁️ Live Email Preview
              </button>
            </div>

            {!previewMode ? (
              <form onSubmit={handleSendPromotion} className={styles.composerForm}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Email Subject Line *</label>
                    <input
                      type="text"
                      required
                      value={composerData.subject}
                      onChange={(e) =>
                        setComposerData({ ...composerData, subject: e.target.value })
                      }
                      placeholder="e.g. Special Festive Offer: 15% OFF on Pure Mustard Oil!"
                    />
                  </div>
                </div>

                <div className={styles.formRow2}>
                  <div className={styles.inputGroup}>
                    <label>Campaign Headline *</label>
                    <input
                      type="text"
                      required
                      value={composerData.headline}
                      onChange={(e) =>
                        setComposerData({ ...composerData, headline: e.target.value })
                      }
                      placeholder="e.g. Celebrate With Pure Mill Goodness"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Scheme / Promo Code (Optional)</label>
                    <input
                      type="text"
                      value={composerData.offerCode || ''}
                      onChange={(e) =>
                        setComposerData({ ...composerData, offerCode: e.target.value })
                      }
                      placeholder="e.g. PANDIT15"
                    />
                  </div>
                </div>

                <div className={styles.formRow2}>
                  <div className={styles.inputGroup}>
                    <label>Discount / Scheme Highlight Text</label>
                    <input
                      type="text"
                      value={composerData.discountText || ''}
                      onChange={(e) =>
                        setComposerData({ ...composerData, discountText: e.target.value })
                      }
                      placeholder="e.g. 15% Flat Discount on orders above ₹499"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Button Text (CTA)</label>
                    <input
                      type="text"
                      value={composerData.ctaText || ''}
                      onChange={(e) =>
                        setComposerData({ ...composerData, ctaText: e.target.value })
                      }
                      placeholder="Shop Pure Products →"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Offer Message Body *</label>
                    <textarea
                      rows={5}
                      required
                      value={composerData.message}
                      onChange={(e) =>
                        setComposerData({ ...composerData, message: e.target.value })
                      }
                      placeholder="Write your personal promotional message here..."
                    />
                  </div>
                </div>

                {sendResult && (
                  <div
                    className={`${styles.resultNotice} ${
                      sendResult.success ? styles.resultSuccess : styles.resultError
                    }`}
                  >
                    <span>{sendResult.success ? '✅' : '⚠️'}</span>
                    <p>{sendResult.message}</p>
                  </div>
                )}

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className={styles.cancelBtn}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitSendBtn}
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <span className={styles.btnSpinner} />
                        <span>Sending Emails...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>
                          Dispatch Campaign (
                          {composerData.recipientType === 'all'
                            ? customers.length
                            : composerData.recipientEmails?.length || 1}
                          )
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.previewContainer}>
                {/* Visual email preview wrapper */}
                <div className={styles.emailPreviewFrame}>
                  <div className={styles.previewHeader}>
                    <div style={{ fontSize: '28px' }}>🌶️</div>
                    <h3>NEW PANDIT MASALA &amp; TEL MILL</h3>
                    <p>Pure Cold-Pressed Oils &amp; Slow Stone-Ground Spices Since 1984</p>
                  </div>

                  <div className={styles.previewBody}>
                    <p style={{ color: '#78716c', fontSize: '0.875rem' }}>
                      Dear Valued Patron,
                    </p>
                    <h2 className={styles.previewHeadline}>{composerData.headline}</h2>
                    <p className={styles.previewMessage}>{composerData.message}</p>

                    {(composerData.offerCode || composerData.discountText) && (
                      <div className={styles.previewVoucherBox}>
                        {composerData.discountText && (
                          <div className={styles.voucherDiscount}>
                            {composerData.discountText}
                          </div>
                        )}
                        {composerData.offerCode && (
                          <div className={styles.voucherCode}>
                            <small>SCHEME / PROMO CODE</small>
                            <strong>{composerData.offerCode}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                      <span className={styles.previewCtaBtn}>
                        {composerData.ctaText || 'Shop Pure Products →'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.previewFooter}>
                    <strong>New Pandit Masala &amp; Tel Mill</strong>
                    <br />
                    Vaishali Bus Stand Road, Lalganj 844121, Vaishali, Bihar
                    <br />
                    Helpline: +91 9934787476
                  </div>
                </div>

                <div className={styles.modalFooter} style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={styles.cancelBtn}
                  >
                    ← Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSendPromotion(e as unknown as React.FormEvent)}
                    className={styles.submitSendBtn}
                    disabled={sending}
                  >
                    <span>🚀</span> Send Campaign Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
