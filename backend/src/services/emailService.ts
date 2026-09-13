import nodemailer from 'nodemailer';

const isConfigured = (): boolean => Boolean(
  process.env.SMTP_HOST && process.env.SMTP_FROM
);

export const sendLoginOtpEmail = async (email: string, code: string): Promise<void> => {
  if (!isConfigured()) {
    const error = new Error('Email sign-in is not configured. Set SMTP_HOST and SMTP_FROM on the server.') as Error & { statusCode?: number };
    error.statusCode = 503;
    throw error;
  }

  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === 'true',
    ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Your New Pandit sign-in code',
    text: `Your New Pandit sign-in code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `<p>Your New Pandit sign-in code is:</p><p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
  });
};
