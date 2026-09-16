import nodemailer from 'nodemailer';

const isConfigured = (): boolean => Boolean(
  process.env.SMTP_HOST && process.env.SMTP_FROM
);

const createTransporter = () => {
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === 'true',
    ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
  });
};

export const sendLoginOtpEmail = async (email: string, code: string): Promise<void> => {
  if (!isConfigured()) {
    const error = new Error('Email sign-in is not configured. Set SMTP_HOST and SMTP_FROM on the server.') as Error & { statusCode?: number };
    error.statusCode = 503;
    throw error;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Your New Pandit sign-in code',
    text: `Your New Pandit sign-in code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `<p>Your New Pandit sign-in code is:</p><p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
  });
};

export const sendOrderReadyEmail = async (
  email: string,
  orderNumber: string,
  total: number
): Promise<void> => {
  if (!isConfigured()) {
    console.warn('[Email] SMTP not configured — skipping order-ready notification.');
    return;
  }

  const transporter = createTransporter();
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(total);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Your order ${orderNumber} is ready for pickup! 🎉`,
    text: [
      `Great news! Your order ${orderNumber} is ready for pickup at New Pandit Masala & Tel Mill.`,
      `Order Total: ${formattedTotal}`,
      '',
      'Please visit the shop at your earliest convenience to collect your items.',
      '',
      'Thank you for choosing New Pandit Masala & Tel Mill!',
    ].join('\n'),
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fcfbf9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">🎉</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #1f1d1a; text-align: center; margin-bottom: 8px;">
          Your Order is Ready!
        </h1>
        <p style="font-size: 15px; color: #5f5b53; text-align: center; margin-bottom: 24px;">
          Order <strong style="color: #b45309;">${orderNumber}</strong> is prepared and waiting for you.
        </p>
        <div style="background: #ffffff; border: 1px solid #e2ded6; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 13px; color: #5f5b53; text-transform: uppercase; letter-spacing: 1px;">Order Total</span>
          <div style="font-size: 28px; font-weight: 800; color: #b45309; margin-top: 4px;">${formattedTotal}</div>
        </div>
        <p style="font-size: 14px; color: #5f5b53; text-align: center; line-height: 1.6;">
          Please visit <strong>New Pandit Masala &amp; Tel Mill</strong> at your earliest convenience to collect your items.
        </p>
        <hr style="border: none; border-top: 1px solid #e2ded6; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9a948e; text-align: center;">
          Thank you for choosing New Pandit Masala &amp; Tel Mill!
        </p>
      </div>
    `,
  });
};

export interface PromotionalEmailOptions {
  to: string;
  customerName?: string;
  subject: string;
  headline: string;
  offerCode?: string;
  discountText?: string;
  message: string;
  ctaUrl?: string;
  ctaText?: string;
}

export const sendPromotionalEmail = async (
  options: PromotionalEmailOptions
): Promise<void> => {
  if (!isConfigured()) {
    console.warn('[Email] SMTP not configured — skipping promotional email to:', options.to);
    return;
  }

  const transporter = createTransporter();
  const ctaUrl = options.ctaUrl || process.env.CLIENT_URL || 'http://localhost:3000';
  const ctaText = options.ctaText || 'Shop Pure Products →';
  const greeting = options.customerName ? `Dear ${options.customerName},` : 'Valued Customer,';

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: [
      greeting,
      '',
      options.headline,
      '',
      options.message,
      '',
      options.offerCode ? `Use Scheme/Promo Code: ${options.offerCode}` : '',
      options.discountText ? `Benefit: ${options.discountText}` : '',
      '',
      `Visit us: ${ctaUrl}`,
      '',
      'New Pandit Masala & Tel Mill',
      'Vaishali Bus Stand Road, Lalganj 844121, Vaishali, Bihar',
      'Helpline: +91 9934787476',
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #fcfbf9; border-radius: 14px; overflow: hidden; border: 1px solid #e8e1d5; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #181512 0%, #26211c 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #b45309;">
          <div style="font-size: 32px; margin-bottom: 8px;">🌶️</div>
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">NEW PANDIT MASALA &amp; TEL MILL</h2>
          <p style="color: #d6d3d1; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Pure Cold-Pressed Oils &amp; Slow Stone-Ground Spices Since 1984</p>
        </div>

        <div style="padding: 32px 28px;">
          <p style="font-size: 15px; color: #5f5b53; margin-top: 0;">${greeting}</p>

          <h1 style="font-size: 22px; font-weight: 800; color: #1f1d1a; line-height: 1.3; margin: 16px 0 12px;">
            ${options.headline}
          </h1>

          <div style="font-size: 15px; color: #3f3b33; line-height: 1.65; white-space: pre-line; margin-bottom: 24px;">
            ${options.message}
          </div>

          ${options.offerCode || options.discountText ? `
            <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #b45309; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              ${options.discountText ? `<div style="font-size: 18px; font-weight: 800; color: #9a3412; margin-bottom: 6px;">${options.discountText}</div>` : ''}
              ${options.offerCode ? `
                <div style="display: inline-block; background: #ffffff; border: 1px solid #d97706; padding: 6px 18px; border-radius: 8px; margin-top: 6px;">
                  <span style="font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Offer / Scheme Code</span>
                  <span style="font-size: 20px; font-weight: 800; color: #b45309; letter-spacing: 2px;">${options.offerCode}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #b45309 0%, #d97706 100%); color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);">
              ${ctaText}
            </a>
          </div>
        </div>

        <div style="background: #f4f0eb; padding: 20px 24px; text-align: center; border-top: 1px solid #e2ded6; font-size: 12px; color: #78716c; line-height: 1.6;">
          <strong>New Pandit Masala &amp; Tel Mill</strong><br />
          Vaishali Bus Stand Road, Lalganj 844121, Vaishali, Bihar<br />
          Helpline / WhatsApp: <a href="tel:+919934787476" style="color: #b45309; text-decoration: none;">+91 9934787476</a><br />
          <span style="color: #a8a29e; font-size: 11px; margin-top: 6px; display: block;">You received this email because you are a registered patron of New Pandit Mill.</span>
        </div>
      </div>
    `,
  });
};
