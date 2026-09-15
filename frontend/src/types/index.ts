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
  tax: number;
  total: number;
  status: OrderStatus;
  paymentScreenshotUrl?: string;
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
  message?: string;
}
