import { Schema, model, Document } from 'mongoose';

export interface IMillRate {
  label: string;
  price: string;
}

export interface ISettings extends Document {
  key: string;
  storeName: string;
  phones: string[];
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  upiId: string;
  upiName: string;
  taxRate: number;
  gstin: string;
  fssaiLicense: string;
  lowStockThreshold: number;
  acceptingOrders: boolean;
  closedMessage: string;
  announcement: string;
  millRates: IMillRate[];
  updatedAt: Date;
}

const MillRateSchema = new Schema<IMillRate>(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: String, required: true, trim: true, maxlength: 30 },
  },
  { _id: false }
);

/** Single-document store configuration editable from the admin panel. */
const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: 'store', unique: true },
    storeName: { type: String, default: 'New Pandit Masala & Tel Mill', trim: true, maxlength: 80 },
    phones: { type: [String], default: ['+919934787476', '+918226889960'] },
    whatsapp: { type: String, default: '919934787476', trim: true },
    email: { type: String, default: 'asharfipandit844121@gmail.com', trim: true, lowercase: true },
    address: { type: String, default: 'Vaishali Bus Stand Road, Lalganj 844121, Vaishali, Bihar', trim: true },
    hours: { type: String, default: 'Mon - Sun: 8:00 AM - 9:00 PM', trim: true },
    upiId: { type: String, default: '6205372825@axl', trim: true },
    upiName: { type: String, default: 'New Pandit Masala Tel Mill', trim: true },
    taxRate: { type: Number, default: 5, min: 0, max: 28 },
    // Printed on bills when set
    gstin: { type: String, default: '', trim: true, uppercase: true, maxlength: 15 },
    fssaiLicense: { type: String, default: '10023948000122', trim: true, maxlength: 20 },
    // Products at or below this stock are flagged on the dashboard and inventory page
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    acceptingOrders: { type: Boolean, default: true },
    closedMessage: {
      type: String,
      default: 'Online ordering is paused right now. Please call the mill to order.',
      trim: true,
      maxlength: 200,
    },
    announcement: { type: String, default: '', trim: true, maxlength: 160 },
    millRates: {
      type: [MillRateSchema],
      default: [
        { label: 'Yellow Mustard Oil', price: '₹172/L' },
        { label: 'Black Mustard Oil', price: '₹158/L' },
        { label: 'Turmeric Grinding', price: '₹18/kg' },
        { label: 'Chilli Grinding', price: '₹22/kg' },
        { label: 'Fresh Chakki Atta', price: '₹6/kg' },
      ],
    },
  },
  { timestamps: true }
);

SettingsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { _id, __v, key, ...rest } = ret as unknown as Record<string, unknown>;
    return rest;
  },
});

export const Settings = model<ISettings>('Settings', SettingsSchema);

/** Returns the store settings, creating the defaults on first use. */
export const getStoreSettings = async (): Promise<ISettings> =>
  Settings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { key: 'store' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ) as Promise<ISettings>;
