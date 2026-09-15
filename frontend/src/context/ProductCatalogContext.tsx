'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '@/lib/api';
import { Category, Product } from '@/types';

interface ProductCatalogContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
}

const ProductCatalogContext = createContext<ProductCatalogContextType | undefined>(undefined);

const getRealtimeUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export function ProductCatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setError(null);
    } catch (nextError: unknown) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load the product catalogue.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void refreshCatalog();
    }, 0);

    const socket = io(getRealtimeUrl(), {
      transports: ['polling', 'websocket'],
    });
    const handleProductsChanged = () => {
      void refreshCatalog();
    };
    socket.on('products:changed', handleProductsChanged);

    // Re-sync periodically as a fallback if a browser was briefly offline.
    const resyncTimer = window.setInterval(() => {
      void refreshCatalog();
    }, 60_000);

    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(resyncTimer);
      socket.off('products:changed', handleProductsChanged);
      socket.disconnect();
    };
  }, [refreshCatalog]);

  return (
    <ProductCatalogContext.Provider value={{ products, categories, isLoading, error, refreshCatalog }}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog(): ProductCatalogContextType {
  const context = useContext(ProductCatalogContext);
  if (!context) {
    throw new Error('useProductCatalog must be used within a ProductCatalogProvider');
  }
  return context;
}
