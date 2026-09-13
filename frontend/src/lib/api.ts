import { Product, Service, Category, Order, User, CallbackRequest } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  // Orders
  async createOrder(orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  }): Promise<Order> {
    const res = await this.request<DataResponse<Order>>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return res.data;
  }

  async getMyOrders(): Promise<Order[]> {
    const res = await this.request<DataResponse<Order[]>>('/orders/my');
    return res.data;
  }

  async getAllOrders(status?: string): Promise<Order[]> {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const res = await this.request<DataResponse<Order[]>>(`/orders${query}`);
    return res.data;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await this.request<DataResponse<Order>>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  }

  // Callbacks / Inquiries
  async submitCallback(data: CallbackRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/callbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
