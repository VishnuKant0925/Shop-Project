'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { Product, CartItem } from '@/types';
import { useProductCatalog } from '@/context/ProductCatalogContext';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] }
  | { type: 'SYNC_PRODUCT_DETAILS'; products: Product[] };

interface CartContextType extends CartState {
  isLoaded: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateTotals(items: CartItem[]): { totalItems: number; totalPrice: number } {
  return items.reduce(
    (acc, item) => ({
      totalItems: acc.totalItems + item.quantity,
      totalPrice: acc.totalPrice + item.product.price * item.quantity,
    }),
    { totalItems: 0, totalPrice: 0 }
  );
}

function cartReducer(state: CartState, action: CartAction): CartState {
  let newItems: CartItem[];

  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.product.id === action.product.id || (item.product.slug && item.product.slug === action.product.slug)
      );
      if (existingIndex >= 0) {
        newItems = state.items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + (action.quantity || 1) }
            : item
        );
      } else {
        newItems = [...state.items, { product: action.product, quantity: action.quantity || 1 }];
      }
      break;
    }
    case 'REMOVE_ITEM':
      newItems = state.items.filter(
        (item) => item.product.id !== action.productId && item.product.slug !== action.productId
      );
      break;
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        newItems = state.items.filter(
          (item) => item.product.id !== action.productId && item.product.slug !== action.productId
        );
      } else {
        newItems = state.items.map((item) =>
          item.product.id === action.productId || item.product.slug === action.productId
            ? { ...item, quantity: action.quantity }
            : item
        );
      }
      break;
    case 'CLEAR_CART':
      newItems = [];
      break;
    case 'LOAD_CART':
      newItems = action.items;
      break;
    case 'SYNC_PRODUCT_DETAILS': {
      if (!action.products || action.products.length === 0) {
        return state;
      }
      const latestById = new Map(action.products.map((product) => [product.id, product]));
      const latestBySlug = new Map(action.products.map((product) => [product.slug, product]));

      newItems = state.items
        .map((item) => {
          const latestProduct =
            latestById.get(item.product.id) ||
            (item.product.slug ? latestBySlug.get(item.product.slug) : undefined);

          if (!latestProduct) {
            // Retain existing item if not in current catalog batch
            return item;
          }
          if (latestProduct.isActive === false) {
            return null;
          }
          return {
            ...item,
            product: {
              ...item.product,
              ...latestProduct,
            },
          };
        })
        .filter(Boolean) as CartItem[];
      break;
    }
    default:
      return state;
  }

  const totals = calculateTotals(newItems);
  return { items: newItems, ...totals };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useProductCatalog();
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart) as CartItem[];
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: 'LOAD_CART', items });
        }
      }
    } catch (e) {
      console.error('Failed to parse saved cart:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Safely sync price or availability updates once cart is loaded
  useEffect(() => {
    if (isLoaded && products.length > 0) {
      dispatch({ type: 'SYNC_PRODUCT_DETAILS', products });
    }
  }, [isLoaded, products]);

  // 3. Save cart to localStorage ONLY AFTER initial load has finished
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('cart', JSON.stringify(state.items));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [isLoaded, state.items]);

  const addItem = useCallback((product: Product, quantity?: number) => {
    dispatch({ type: 'ADD_ITEM', product, quantity });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = state.items.find((i) => i.product.id === productId || i.product.slug === productId);
      return item?.quantity || 0;
    },
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{ ...state, isLoaded, addItem, removeItem, updateQuantity, clearCart, getItemQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
