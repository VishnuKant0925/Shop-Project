import { Document, model, Schema } from 'mongoose';

export interface ILoginOtp extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoginOtpSchema = new Schema<ILoginOtp>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const LoginOtp = model<ILoginOtp>('LoginOtp', LoginOtpSchema);
