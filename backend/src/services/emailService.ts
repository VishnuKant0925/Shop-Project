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
