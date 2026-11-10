import { Product, Service, Category, Order, User, CallbackRequest, CallbackItem, Coupon, StoreSettings, Bill, NewBillInput, StockMovement, StockReason } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.newpanditmasala.shop/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AuthResponse extends ApiResponse {
  token: string;
  user: User;
}

type DataResponse<T> = ApiResponse<T> & { data: T };
type MessageResponse = ApiResponse & { message: string };

export type ApiProduct = Omit<Product, 'id' | 'categoryId'> & {
  id?: string;
  _id?: string;
  categoryId?: string;
  category?: string | { id?: string; _id?: string };
};

type ApiCategory = Omit<Category, 'id'> & { id?: string; _id?: string };

type ApiOrder = Omit<Order, 'id' | 'userId'> & {
  id?: string;
  _id?: string;
  user?: string | { id?: string; _id?: string; name?: string; email?: string; phone?: string };
};

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalServices: number;
  totalUsers: number;
  revenueChange: string;
  ordersChange: string;
  todayOrders?: number;
  counterBillsToday?: number;
  counterSalesToday?: number;
  lowStockThreshold?: number;
  todayRevenue?: number;
  awaitingPayment?: number;
  awaitingVerification?: number;
  pendingEnquiries?: number;
  topProducts?: { name: string; quantity: number; revenue: number }[];
  statusBreakdown: Record<string, number>;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    stockQuantity: number;
    unit: string;
  }[];
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AdminOrdersResult extends Paginated<Order> {
  statusCounts: Record<string, number>;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastOrderNumber: string | null;
  lastOrderStatus: string | null;
}

export interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    createdAt: string;
  }[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
  };
}

export interface PromotionPayload {
  recipientType: 'all' | 'selected' | 'individual';
  recipientEmails?: string[];
  subject: string;
  headline: string;
  offerCode?: string;
  discountText?: string;
  message: string;
  ctaUrl?: string;
  ctaText?: string;
}

export interface PromotionResult {
  success: boolean;
  sentCount: number;
  totalRecipients: number;
  message: string;
  errors?: { email: string; error: string }[];
}

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const { message } = data as { message?: unknown };
    if (typeof message === 'string') return message;
  }
  return fallback;
};

export const normaliseProduct = (product: ApiProduct): Product => {
  const categoryId = product.categoryId
    || (typeof product.category === 'string'
      ? product.category
      : product.category?.id || product.category?._id || '');

  return {
    id: product.id || product._id || '',
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    unit: product.unit,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    categoryId,
    isActive: product.isActive,
    badge: product.badge,
  };
};

const normaliseCategory = (category: ApiCategory): Category => ({
  id: category.id || category._id || '',
  name: category.name,
  slug: category.slug,
  description: category.description,
  imageUrl: category.imageUrl,
});

const normaliseOrder = (order: ApiOrder): Order => ({
  id: order.id || order._id || '',
  orderNumber: order.orderNumber,
  userId: typeof order.user === 'string' ? order.user : (order.user?.id || order.user?._id || ''),
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  shippingAddress: order.shippingAddress,
  items: order.items,
  subtotal: order.subtotal,
  discount: order.discount ?? 0,
  couponCode: order.couponCode || '',
  tax: order.tax,
  total: order.total,
  status: order.status,
  paymentScreenshotUrl: order.paymentScreenshotUrl,
  adminNote: order.adminNote,
  createdAt: order.createdAt,
});

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('pandit_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pandit_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, `Request failed with status ${response.status}`));
    }

    return data as T;
  }

  private async requestWithFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};
    const token = this.getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { method: 'POST', headers, body: formData });
    const data: unknown = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(data, 'Upload failed'));
    return data as T;
  }

  // Health
  async checkHealth(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/health');
  }

  // Auth
  async register(userData: { name: string; email: string; phone: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.saveSession(res);
    return res;
  }

  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.saveSession(res);
    return res;
  }

  async loginWithGoogle(credential: string): Promise<{ token: string; user: User }> {
    const res = await this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    this.saveSession(res);
    return res;
  }

  async requestLoginOtp(email: string): Promise<{ success: boolean; message: string }> {
    return this.request<MessageResponse>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyLoginOtp(email: string, code: string): Promise<{ token: string; user: User }> {
    const res = await this.request<AuthResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    this.saveSession(res);
    return res;
  }

  async getCurrentUser(): Promise<User> {
    const res = await this.request<{ success: boolean; user: User }>('/auth/me');
    return res.user;
  }

  async updateProfile(data: { name?: string; phone?: string; password?: string }): Promise<{ token: string; user: User }> {
    const res = await this.request<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.saveSession(res);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request<ApiResponse>('/auth/logout', { method: 'POST' });
    } finally {
      this.clearSession();
    }
  }

  private saveSession(res: { token?: string; user?: User }): void {
    if (res.token && res.user && typeof window !== 'undefined') {
      localStorage.setItem('pandit_token', res.token);
      localStorage.setItem('pandit_user', JSON.stringify(res.user));
    }
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pandit_token');
      localStorage.removeItem('pandit_user');
    }
  }

  // Products
  async getProducts(params?: { category?: string; search?: string; sort?: string; all?: boolean }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.all) query.append('all', 'true');
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<DataResponse<ApiProduct[]>>(`/products${queryStr}`);
    return res.data.map(normaliseProduct);
  }

  async getProduct(identifier: string): Promise<Product> {
    const res = await this.request<DataResponse<ApiProduct>>(`/products/${identifier}`);
    return normaliseProduct(res.data);
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const res = await this.request<DataResponse<ApiProduct>>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return normaliseProduct(res.data);
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const res = await this.request<DataResponse<ApiProduct>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return normaliseProduct(res.data);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request<ApiResponse>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await this.request<DataResponse<ApiCategory[]>>('/categories');
    return res.data.map(normaliseCategory);
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await this.request<DataResponse<ApiCategory>>('/categories', { method: 'POST', body: JSON.stringify(data) });
    return normaliseCategory(res.data);
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await this.request<DataResponse<ApiCategory>>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return normaliseCategory(res.data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request<ApiResponse>(`/categories/${id}`, { method: 'DELETE' });
  }

  // Store settings
  async getSettings(): Promise<StoreSettings> {
    const res = await this.request<DataResponse<StoreSettings>>('/settings');
    return res.data;
  }

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await this.request<DataResponse<StoreSettings>>('/settings', { method: 'PUT', body: JSON.stringify(data) });
    return res.data;
  }

  // Coupons
  async validateCoupon(code: string, subtotal: number): Promise<{ code: string; discount: number; description: string; message: string }> {
    const res = await this.request<DataResponse<{ code: string; discount: number; description: string }> & { message: string }>(
      '/coupons/validate',
      { method: 'POST', body: JSON.stringify({ code, subtotal }) }
    );
    return { ...res.data, message: res.message };
  }

  async getCoupons(): Promise<Coupon[]> {
    const res = await this.request<DataResponse<Coupon[]>>('/coupons');
    return res.data;
  }

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const res = await this.request<DataResponse<Coupon>>('/coupons', { method: 'POST', body: JSON.stringify(data) });
    return res.data;
  }

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const res = await this.request<DataResponse<Coupon>>(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return res.data;
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.request<ApiResponse>(`/coupons/${id}`, { method: 'DELETE' });
  }

  // Services
  async getServices(options?: { all?: boolean }): Promise<Service[]> {
    const res = await this.request<DataResponse<Service[]>>(options?.all ? '/services?all=true' : '/services');
    return res.data;
  }

  async getService(identifier: string): Promise<Service> {
    const res = await this.request<DataResponse<Service>>(`/services/${identifier}`);
    return res.data;
  }

  async createService(serviceData: Partial<Service>): Promise<Service> {
    const res = await this.request<DataResponse<Service>>('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    return res.data;
  }

  async updateService(id: string, serviceData: Partial<Service>): Promise<Service> {
    const res = await this.request<DataResponse<Service>>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
    return res.data;
  }

  async deleteService(id: string): Promise<void> {
    await this.request<ApiResponse>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async createOrder(orderData: {
    items: { productId: string; quantity: number }[];
    notes?: string;
    couponCode?: string;
  }): Promise<Order> {
    const res = await this.request<DataResponse<ApiOrder>>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return normaliseOrder(res.data);
  }

  async uploadPaymentScreenshot(orderId: string, file: File): Promise<Order> {
    const formData = new FormData();
    formData.append('screenshot', file);

    const url = `${this.baseUrl}/orders/${orderId}/payment-screenshot`;
    const headers: HeadersInit = {};
    const token = this.getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { method: 'POST', headers, body: formData });
    const data: unknown = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(data, 'Failed to upload payment proof.'));
    return normaliseOrder((data as DataResponse<ApiOrder>).data);
  }

  async getOrder(id: string): Promise<Order> {
    const res = await this.request<DataResponse<ApiOrder>>(`/orders/${id}`);
    return normaliseOrder(res.data);
  }

  async getMyOrders(): Promise<Order[]> {
    const res = await this.request<DataResponse<ApiOrder[]>>('/orders/my');
    return res.data.map(normaliseOrder);
  }

  async getAllOrders(params: { status?: string; q?: string; page?: number; limit?: number } = {}): Promise<AdminOrdersResult> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.q?.trim()) query.append('q', params.q.trim());
    query.append('page', String(params.page || 1));
    query.append('limit', String(params.limit || 25));
    const res = await this.request<DataResponse<ApiOrder[]> & Omit<AdminOrdersResult, 'data'>>(`/orders?${query}`);
    return { data: res.data.map(normaliseOrder), pagination: res.pagination, statusCounts: res.statusCounts };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.updateOrder(id, { status });
  }

  async updateOrder(id: string, data: { status?: string; adminNote?: string }): Promise<Order> {
    const res = await this.request<DataResponse<ApiOrder>>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normaliseOrder(res.data);
  }

  async cancelMyOrder(id: string): Promise<Order> {
    const res = await this.request<DataResponse<ApiOrder>>(`/orders/${id}/cancel`, { method: 'POST' });
    return normaliseOrder(res.data);
  }

  // Callbacks / Inquiries
  async submitCallback(data: CallbackRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/callbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCallbacks(params: { status?: string; q?: string; page?: number } = {}): Promise<Paginated<CallbackItem> & { pendingCount: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.q?.trim()) query.append('q', params.q.trim());
    query.append('page', String(params.page || 1));
    return this.request(`/callbacks?${query}`);
  }

  async updateCallbackStatus(id: string, status: CallbackItem['status']): Promise<CallbackItem> {
    const res = await this.request<DataResponse<CallbackItem>>(`/callbacks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    return res.data;
  }

  async deleteCallback(id: string): Promise<void> {
    await this.request<ApiResponse>(`/callbacks/${id}`, { method: 'DELETE' });
  }

  // Counter billing (admin)
  async createBill(data: NewBillInput): Promise<Bill> {
    const res = await this.request<DataResponse<Bill>>('/bills', { method: 'POST', body: JSON.stringify(data) });
    return res.data;
  }

  async getBills(params: { q?: string; from?: string; to?: string; status?: string; page?: number } = {}): Promise<Paginated<Bill> & { summary: { count: number; sales: number; discount: number } }> {
    const query = new URLSearchParams();
    if (params.q?.trim()) query.append('q', params.q.trim());
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    query.append('page', String(params.page || 1));
    return this.request(`/bills?${query}`);
  }

  async voidBill(id: string, reason: string): Promise<Bill> {
    const res = await this.request<DataResponse<Bill>>(`/bills/${id}/void`, { method: 'POST', body: JSON.stringify({ reason }) });
    return res.data;
  }

  // Inventory (admin)
  async adjustStock(productId: string, data: { reason: Extract<StockReason, 'restock' | 'wastage' | 'correction'>; quantity?: number; setTo?: number; note?: string }): Promise<{ id: string; stockQuantity: number }> {
    const res = await this.request<DataResponse<{ id: string; stockQuantity: number }>>(`/inventory/products/${productId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async getStockMovements(params: { product?: string; page?: number } = {}): Promise<Paginated<StockMovement>> {
    const query = new URLSearchParams();
    if (params.product) query.append('product', params.product);
    query.append('page', String(params.page || 1));
    return this.request(`/inventory/movements?${query}`);
  }

  // Notifications
  async getNotifications(page = 1, limit = 20): Promise<{ data: Notification[]; pagination: { page: number; total: number; pages: number } }> {
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadCount(): Promise<number> {
    const res = await this.request<{ success: boolean; count: number }>('/notifications/unread-count');
    return res.count;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'PATCH' });
  }

  // Image Upload
  async uploadImage(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    const res = await this.requestWithFormData<{ success: boolean; url: string }>('/upload/image', formData);
    return res.url;
  }

  // Dashboard Stats (Admin)
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await this.request<DataResponse<DashboardStats>>('/stats/dashboard');
    return res.data;
  }

  // Customers & CRM (Admin)
  async getCustomers(query = ''): Promise<{ data: CustomerSummary[]; stats: { totalCustomers: number; totalOrders: number; totalSpend: number; repeatCustomers: number } }> {
    const q = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    const res = await this.request<{ success: boolean; data: CustomerSummary[]; stats: { totalCustomers: number; totalOrders: number; totalSpend: number; repeatCustomers: number } }>(`/customers${q}`);
    return { data: res.data, stats: res.stats };
  }

  async getCustomerDetails(id: string): Promise<CustomerDetail> {
    const res = await this.request<DataResponse<CustomerDetail>>(`/customers/${id}`);
    return res.data;
  }

  async sendCustomerPromotion(payload: PromotionPayload): Promise<PromotionResult> {
    return this.request<PromotionResult>('/customers/send-promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
