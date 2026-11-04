export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: 'kg' | 'litre' | 'packet';
  stockQuantity: number;
  imageUrl: string;
  categoryId: string;
  isActive: boolean;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  rate: number;
  rateUnit: string;
  imageUrl: string;
  icon: string;
  isActive: boolean;
  features: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentScreenshotUrl?: string;
  adminNote?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CallbackRequest {
  name: string;
  phone: string;
  email?: string;
  message?: string;
}

export interface CallbackItem extends CallbackRequest {
  id: string;
  status: 'pending' | 'contacted' | 'resolved';
  createdAt: string;
}

export interface MillRate {
  label: string;
  price: string;
}

export interface StoreSettings {
  storeName: string;
  phones: string[];
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  upiId: string;
  upiName: string;
  taxRate: number;
  acceptingOrders: boolean;
  closedMessage: string;
  announcement: string;
  millRates: MillRate[];
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount: number;
  expiresAt?: string | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
}
