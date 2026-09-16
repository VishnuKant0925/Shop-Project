import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'order_placed'
  | 'order_status_changed'
  | 'order_ready'
  | 'new_order';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['order_placed', 'order_status_changed', 'order_ready', 'new_order'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-delete notifications older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound index for efficient queries
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

NotificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Notification = model<INotification>('Notification', NotificationSchema);
