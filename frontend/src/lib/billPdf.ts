import type { jsPDF as JsPDF, GState as GStateType } from 'jspdf';
import { Bill, Order, PaymentMode, StoreSettings } from '@/types';

/* ── What goes on a printed bill (shared by counter bills and online-order invoices) ── */
export interface BillDocument {
  number: string;
  date: Date;
  customerName?: string;
  customerPhone?: string;
  items: { name: string; quantity: number; unit?: string; rate: number; amount: number }[];
  subtotal: number;
  discount: number;
  discountLabel?: string;
  tax: number;
  taxLabel: string;
  total: number;
  paymentLabel?: string;
  notes?: string;
  status: 'paid' | 'void';
}

const paymentNames: Record<PaymentMode, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', credit: 'Credit (due)' };

export const billToDocument = (bill: Bill): BillDocument => ({
  number: bill.billNumber,
  date: new Date(bill.createdAt),
  customerName: bill.customerName,
  customerPhone: bill.customerPhone,
  items: bill.items,
  subtotal: bill.subtotal,
  discount: bill.discount,
  discountLabel: bill.discountType === 'percent' ? `Discount (${bill.discountValue}%)` : 'Discount',
  tax: bill.tax,
  taxLabel: bill.taxRate > 0 ? `GST (${bill.taxRate}%)` : 'GST',
  total: bill.total,
  paymentLabel: paymentNames[bill.paymentMode],
  notes: bill.notes,
  status: bill.status,
});

export const orderToDocument = (order: Order): BillDocument => ({
  number: order.orderNumber,
  date: new Date(order.createdAt),
  customerName: order.customerName,
  customerPhone: order.customerPhone,
  items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, rate: i.unitPrice, amount: i.totalPrice })),
  subtotal: order.subtotal,
  discount: order.discount || 0,
  discountLabel: order.couponCode ? `Coupon ${order.couponCode}` : 'Discount',
  tax: order.tax,
  taxLabel: 'GST',
  total: order.total,
  paymentLabel: 'UPI (online order)',
  status: order.status === 'cancelled' ? 'void' : 'paid',
});

/* ── Formatting (built-in PDF fonts have no ₹ glyph, so amounts use "Rs.") ── */
const num = (n: number, decimals = 2) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const rs = (n: number) => `Rs. ${num(n)}`;
const qty = (q: number) => (Number.isInteger(q) ? String(q) : num(q, 2).replace(/0$/, ''));
const formatDate = (d: Date) =>
  d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const INK = { r: 31, g: 29, b: 26 };
const MUTED = { r: 110, g: 104, b: 96 };
const LINE = { r: 226, g: 222, b: 214 };
const STAMP_BLUE = { r: 29, g: 53, b: 140 };
const STAMP_RED = { r: 185, g: 28, b: 28 };

/**
 * Round rubber-stamp style seal: shop name around the top, place around the bottom,
 * PAID / CANCELLED and the date in the middle. Drawn as vector text so it stays sharp.
 */
const drawStamp = (
  doc: JsPDF,
  cx: number,
  cy: number,
  opts: { top: string; bottom: string; centre: string; date: string; color: { r: number; g: number; b: number } },
  inkOpacity: GStateType
) => {
  const tilt = (-12 * Math.PI) / 180; // a real stamp is rarely perfectly straight
  const R = 17;
  const rIn = 11.2;
  const rot = (x: number, y: number) => ({
    x: cx + x * Math.cos(tilt) + y * Math.sin(tilt),
    y: cy - (-x * Math.sin(tilt) + y * Math.cos(tilt)),
  });
  const deg = (rad: number) => (rad * 180) / Math.PI;

  doc.saveGraphicsState();
  doc.setGState(inkOpacity);
  doc.setDrawColor(opts.color.r, opts.color.g, opts.color.b);
  doc.setTextColor(opts.color.r, opts.color.g, opts.color.b);

  doc.setLineWidth(0.9);
  doc.circle(cx, cy, R, 'S');
  doc.setLineWidth(0.35);
  doc.circle(cx, cy, R - 1.6, 'S');
  doc.circle(cx, cy, rIn, 'S');

  // Text along an arc. `outward` = letters stand on the inner baseline (top arc).
  const arcText = (text: string, radius: number, centreAngle: number, outward: boolean, size: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    const spacing = 0.35;
    const widths = [...text].map((ch) => doc.getTextWidth(ch) + spacing);
    const span = widths.reduce((a, b) => a + b, 0) / radius;
    let acc = 0;
    [...text].forEach((ch, i) => {
      const w = widths[i];
      const mid = (acc + w / 2) / radius;
      acc += w;
      // Top arc reads clockwise (angle decreasing); bottom arc reads counter-clockwise.
      const theta = outward ? centreAngle + span / 2 - mid : centreAngle - span / 2 + mid;
      const dir = outward ? { x: Math.sin(theta), y: -Math.cos(theta) } : { x: -Math.sin(theta), y: Math.cos(theta) };
      const cxp = radius * Math.cos(theta) - (dir.x * (w - spacing)) / 2;
      const cyp = radius * Math.sin(theta) - (dir.y * (w - spacing)) / 2;
      const p = rot(cxp, cyp);
      const angle = deg(outward ? theta - Math.PI / 2 : theta + Math.PI / 2) + deg(tilt);
      doc.text(ch, p.x, p.y, { angle });
    });
  };

  arcText(opts.top, rIn + 1.1, Math.PI / 2, true, 6.2);
  arcText(opts.bottom, R - 2.6, (3 * Math.PI) / 2, false, 5.6);

  // Centre: big word + date, rotated with the stamp
  const centred = (text: string, size: number, yOffset: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    const w = doc.getTextWidth(text);
    const p = rot(-w / 2, -yOffset);
    doc.text(text, p.x, p.y, { angle: deg(tilt) });
  };
  centred(opts.centre, opts.centre.length > 5 ? 6.4 : 9, -0.6);
  centred(opts.date, 4.6, 3.6);

  doc.restoreGraphicsState();
};

/** Build the bill PDF. jsPDF is loaded only when a bill is actually needed. */
export const buildBillPdf = async (bill: BillDocument, shop: StoreSettings): Promise<JsPDF> => {
  const { jsPDF, GState } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;
  const right = W - M;
  let y = 16;

  const text = (s: string, x: number, yy: number, o: { size?: number; bold?: boolean; color?: typeof INK; align?: 'left' | 'right' | 'center' } = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size ?? 9);
    const c = o.color ?? INK;
    doc.setTextColor(c.r, c.g, c.b);
    doc.text(s, x, yy, { align: o.align ?? 'left' });
  };
  const rule = (yy: number) => {
    doc.setDrawColor(LINE.r, LINE.g, LINE.b);
    doc.setLineWidth(0.3);
    doc.line(M, yy, right, yy);
  };

  /* Header: shop identity */
  text(shop.storeName, M, y, { size: 15, bold: true });
  y += 5;
  const addressLines = doc.splitTextToSize(shop.address, W - 2 * M) as string[];
  addressLines.forEach((l) => { text(l, M, y, { size: 8, color: MUTED }); y += 3.6; });
  const ids = [
    shop.phones[0] ? `Ph: ${shop.phones[0]}` : '',
    shop.gstin ? `GSTIN: ${shop.gstin}` : '',
    shop.fssaiLicense ? `FSSAI: ${shop.fssaiLicense}` : '',
  ].filter(Boolean).join('   ');
  if (ids) { text(ids, M, y, { size: 8, color: MUTED }); y += 3.6; }
  y += 1.5;
  rule(y);
  y += 6;

  /* Bill meta */
  text('BILL', M, y, { size: 11, bold: true });
  text(`No. ${bill.number}`, right, y, { size: 9, bold: true, align: 'right' });
  y += 4.5;
  text(formatDate(bill.date), right, y, { size: 8, color: MUTED, align: 'right' });
  const customer = [bill.customerName, bill.customerPhone].filter(Boolean).join(' · ');
  if (customer) text(`To: ${customer}`, M, y, { size: 8.5 });
  y += 7;

  /* Items table */
  const col = { qty: W - M - 50, rate: W - M - 24, amount: right };
  doc.setFillColor(246, 243, 238);
  doc.rect(M, y - 4.2, W - 2 * M, 6.4, 'F');
  text('Item', M + 2, y, { size: 8, bold: true, color: MUTED });
  text('Qty', col.qty, y, { size: 8, bold: true, color: MUTED, align: 'right' });
  text('Rate', col.rate, y, { size: 8, bold: true, color: MUTED, align: 'right' });
  text('Amount', col.amount - 2, y, { size: 8, bold: true, color: MUTED, align: 'right' });
  y += 7;

  const nameWidth = col.qty - M - 14;
  for (const item of bill.items) {
    const nameLines = doc.splitTextToSize(item.name, nameWidth) as string[];
    const rowHeight = Math.max(1, nameLines.length) * 4 + 2.4;
    if (y + rowHeight > H - 70) { doc.addPage(); y = 18; }
    nameLines.forEach((l, i) => text(l, M + 2, y + i * 4, { size: 9 }));
    text(`${qty(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`, col.qty, y, { size: 9, align: 'right' });
    text(num(item.rate), col.rate, y, { size: 9, align: 'right' });
    text(num(item.amount), col.amount - 2, y, { size: 9, align: 'right' });
    y += rowHeight;
  }
  rule(y - 2);
  y += 4;

  /* Totals (right-aligned, only the lines that apply) */
  const labelX = col.rate - 6;
  const totalLine = (label: string, value: string, bold = false, size = 9) => {
    text(label, labelX, y, { size, bold, color: bold ? INK : MUTED, align: 'right' });
    text(value, col.amount - 2, y, { size, bold, align: 'right' });
    y += bold ? 7 : 5;
  };
  totalLine('Subtotal', rs(bill.subtotal));
  if (bill.discount > 0) totalLine(bill.discountLabel || 'Discount', `- ${rs(bill.discount)}`);
  if (bill.tax > 0) totalLine(bill.taxLabel, rs(bill.tax));
  y += 1;
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(0.4);
  doc.line(labelX - 30, y - 4.5, right, y - 4.5);
  totalLine('Total', rs(bill.total), true, 12);
  if (bill.paymentLabel && bill.status !== 'void') text(`Paid by ${bill.paymentLabel}`, col.amount - 2, y - 2.5, { size: 8, color: MUTED, align: 'right' });

  /* Note + digital stamp + footer */
  // Stamp sits just below the totals; move to a new page only if it would not fit
  if (y + 46 > H - 16) { doc.addPage(); y = 20; }
  const stampY = y + 22;
  if (bill.notes) {
    const noteLines = doc.splitTextToSize(`Note: ${bill.notes}`, W / 2 - M) as string[];
    noteLines.slice(0, 3).forEach((l, i) => text(l, M, stampY - 12 + i * 4, { size: 8, color: MUTED }));
  }
  const place = shop.address.split(',').slice(-2).join(',').replace(/\d{6}/, '').trim().toUpperCase() || 'INDIA';
  drawStamp(doc, right - 19, stampY, {
    top: shop.storeName.toUpperCase().replace(/&/g, 'AND'),
    bottom: `* ${place} *`,
    centre: bill.status === 'void' ? 'CANCELLED' : 'PAID',
    date: bill.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
    color: bill.status === 'void' ? STAMP_RED : STAMP_BLUE,
  }, new GState({ opacity: 0.88 }));
  text('Authorised signatory', right - 19, stampY + 23, { size: 7, color: MUTED, align: 'center' });

  rule(H - 14);
  text('Thank you for shopping with us!', M, H - 9, { size: 8, color: MUTED });
  text('Computer-generated bill', right, H - 9, { size: 7, color: MUTED, align: 'right' });

  return doc;
};

/** Build the bill and download it as <bill number>.pdf */
export const downloadBillPdf = async (bill: BillDocument, shop: StoreSettings): Promise<void> => {
  const doc = await buildBillPdf(bill, shop);
  doc.save(`${bill.number}.pdf`);
};
