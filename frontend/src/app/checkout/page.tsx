'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { formatCurrency } from '@/data';
import styles from './page.module.css';

const UPI_ID = '6205372825@axl';
const UPI_NAME = 'New Pandit Masala Tel Mill';

type Step = 'review' | 'payment' | 'upload' | 'confirmed';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, totalPrice, clearCart, isLoaded } = useCart();

  const [step, setStep] = useState<Step>('review');
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // QR code image source with auto-fallback
  const [qrSrc, setQrSrc] = useState('/images/payment-qr.png');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

  // Redirect if cart empty and no order placed yet (only after cart is loaded)
  useEffect(() => {
    if (!authLoading && isLoaded && items.length === 0 && !order) {
      router.replace('/cart');
    }
  }, [authLoading, isLoaded, items.length, order, router]);

  const tax = totalPrice * 0.05;
  const grandTotal = totalPrice + tax;

  /* ── Step 1: Place Order ── */
  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
      }));

      const created = await api.createOrder({ items: orderItems });
      setOrder(created);
      clearCart();
      setStep('payment');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── File handling ── */
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  /* ── Step 3: Upload Screenshot ── */
  const handleUploadScreenshot = async () => {
    if (!selectedFile || !order) return;
    setError('');
    setLoading(true);
    try {
      const updated = await api.uploadPaymentScreenshot(order.id, selectedFile);
      setOrder(updated);
      setStep('confirmed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Progress Bar ── */}
        <div className={styles.progress}>
          {(['review', 'payment', 'upload', 'confirmed'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`${styles.progressStep} ${
                step === s ? styles.progressStepActive : ''
              } ${
                (['review', 'payment', 'upload', 'confirmed'].indexOf(step) > i) ? styles.progressStepDone : ''
              }`}
            >
              <div className={styles.progressDot}>
                {(['review', 'payment', 'upload', 'confirmed'].indexOf(step) > i) ? '✓' : i + 1}
              </div>
              <span className={styles.progressLabel}>
                {s === 'review' ? 'Review' : s === 'payment' ? 'Pay' : s === 'upload' ? 'Upload Proof' : 'Done'}
              </span>
            </div>
          ))}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className={styles.errorBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ════════════════════ STEP 1: REVIEW ════════════════════ */}
        {step === 'review' && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepIcon}>🛒</span>
              <div>
                <h1 className={styles.stepTitle}>Review Your Order</h1>
                <p className={styles.stepSubtitle}>Confirm items before placing order</p>
              </div>
            </div>

            <div className={styles.orderItems}>
              {items.map((item) => (
                <div key={item.product.id} className={styles.orderItem}>
                  <div className={styles.orderItemInfo}>
                    <strong>{item.product.name}</strong>
                    <span className={styles.orderItemMeta}>
                      {item.quantity} × {formatCurrency(item.product.price)}
                    </span>
                  </div>
                  <span className={styles.orderItemTotal}>
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.totalsCard}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>GST (5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className={styles.totalDivider} />
              <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
                <span>Total Payable</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button className={styles.primaryBtn} onClick={handlePlaceOrder} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : <>Place Order &amp; Pay via UPI</>}
            </button>

            <Link href="/cart" className={styles.backLink}>← Back to Cart</Link>
          </div>
        )}

        {/* ════════════════════ STEP 2: PAYMENT ════════════════════ */}
        {step === 'payment' && order && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepIcon}>📱</span>
              <div>
                <h1 className={styles.stepTitle}>Scan &amp; Pay</h1>
                <p className={styles.stepSubtitle}>Order #{order.orderNumber} placed — now complete the payment</p>
              </div>
            </div>

            <div className={styles.qrSection}>
              <div className={styles.qrCard}>
                <div className={styles.qrAmount}>
                  <span className={styles.qrAmountLabel}>Pay Exactly</span>
                  <span className={styles.qrAmountValue}>{formatCurrency(order.total)}</span>
                </div>
                <div className={styles.qrImageWrap}>
                  <Image
                    src={qrSrc}
                    alt="UPI Payment QR Code"
                    width={220}
                    height={220}
                    className={styles.qrImage}
                    priority
                    onError={() => {
                      if (qrSrc.endsWith('.png')) {
                        setQrSrc('/images/payment-qr.jpeg');
                      } else if (qrSrc.endsWith('.jpeg')) {
                        setQrSrc('/images/payment-qr.png');
                      }
                    }}
                  />
                </div>
                <div className={styles.upiInfo}>
                  <span className={styles.upiLabel}>UPI ID</span>
                  <code className={styles.upiId}>{UPI_ID}</code>
                </div>
              </div>

              <div className={styles.paymentInstructions}>
                <h3>How to Pay</h3>
                <ol>
                  <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                  <li>Scan the QR code or enter the UPI ID manually</li>
                  <li>Pay the exact amount: <strong>{formatCurrency(order.total)}</strong></li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Click the button below and upload the screenshot</li>
                </ol>
                <div className={styles.securityNote}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  100% Secure • Your payment is processed directly through UPI
                </div>
              </div>
            </div>

            <button className={styles.primaryBtn} onClick={() => setStep('upload')}>
              I&apos;ve Completed the Payment →
            </button>
          </div>
        )}

        {/* ════════════════════ STEP 3: UPLOAD PROOF ════════════════════ */}
        {step === 'upload' && order && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepIcon}>📤</span>
              <div>
                <h1 className={styles.stepTitle}>Upload Payment Proof</h1>
                <p className={styles.stepSubtitle}>Attach a screenshot of your UPI payment confirmation</p>
              </div>
            </div>

            <div
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''} ${previewUrl ? styles.dropZoneHasFile : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {previewUrl ? (
                <div className={styles.previewWrap}>
                  <img src={previewUrl} alt="Payment screenshot preview" className={styles.previewImg} />
                  <div className={styles.previewOverlay}>
                    <span>Click to change</span>
                  </div>
                </div>
              ) : (
                <div className={styles.dropContent}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.uploadIcon}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className={styles.dropText}><strong>Drag &amp; drop</strong> your screenshot here</p>
                  <p className={styles.dropSubtext}>or click to browse • JPEG, PNG, WebP • Max 5 MB</p>
                </div>
              )}
            </div>

            {selectedFile && (
              <p className={styles.fileName}>
                📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </p>
            )}

            <button
              className={styles.primaryBtn}
              onClick={handleUploadScreenshot}
              disabled={loading || !selectedFile}
            >
              {loading ? <span className={styles.spinner} /> : <>Submit Payment Proof</>}
            </button>

            <button className={styles.backBtn} onClick={() => setStep('payment')}>
              ← Back to QR Code
            </button>
          </div>
        )}

        {/* ════════════════════ STEP 4: CONFIRMED ════════════════════ */}
        {step === 'confirmed' && order && (
          <div className={`${styles.stepCard} ${styles.confirmedCard}`}>
            <div className={styles.successIcon}>🎉</div>
            <h1 className={styles.successTitle}>Payment Proof Submitted!</h1>
            <p className={styles.successSubtitle}>
              Your order <strong>#{order.orderNumber}</strong> is being reviewed. We&apos;ll notify you via email when it&apos;s ready for pickup.
            </p>

            <div className={styles.confirmationDetails}>
              <div className={styles.confirmRow}>
                <span>Order Number</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Total Paid</span>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Status</span>
                <span className={styles.statusBadge}>Payment Under Review</span>
              </div>
            </div>

            <div className={styles.nextSteps}>
              <h3>What Happens Next?</h3>
              <div className={styles.nextStepsList}>
                <div className={styles.nextStep}>
                  <span className={styles.nextStepNum}>1</span>
                  <div>
                    <strong>Admin Reviews Payment</strong>
                    <p>Our team will verify your payment screenshot</p>
                  </div>
                </div>
                <div className={styles.nextStep}>
                  <span className={styles.nextStepNum}>2</span>
                  <div>
                    <strong>Order Preparation</strong>
                    <p>Your items will be freshly prepared</p>
                  </div>
                </div>
                <div className={styles.nextStep}>
                  <span className={styles.nextStepNum}>3</span>
                  <div>
                    <strong>Ready for Pickup</strong>
                    <p>You&apos;ll receive an email &amp; notification when ready</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.confirmActions}>
              <Link href="/products" className={styles.primaryBtn}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
