import { Product, Service, Category, Order, User, CallbackRequest } from '@/types';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const API_BASE_URL = 'https://api.newpanditmasala.shop/api';

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

type ApiProduct = Omit<Product, 'id' | 'categoryId'> & {
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

const normaliseProduct = (product: ApiProduct): Product => {
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
  tax: order.tax,
  total: order.total,
  status: order.status,
  paymentScreenshotUrl: order.paymentScreenshotUrl,
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
  async getProducts(params?: { category?: string; search?: string; sort?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
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

  // Services
  async getServices(): Promise<Service[]> {
    const res = await this.request<DataResponse<Service[]>>('/services');
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
    items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
    notes?: string;
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

  async getAllOrders(status?: string): Promise<Order[]> {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const res = await this.request<DataResponse<ApiOrder[]>>(`/orders${query}`);
    return res.data.map(normaliseOrder);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await this.request<DataResponse<ApiOrder>>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normaliseOrder(res.data);
  }

  // Callbacks / Inquiries
  async submitCallback(data: CallbackRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/callbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
