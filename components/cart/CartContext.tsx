'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface CartItem {
  id: string;
  cartId?: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  customizations?: {
    meat?: {
      id: string;
      name: string;
      price_adjustment: number;
    } | null;
    sauces?: Array<{
      id: string;
      name: string;
      price_adjustment: number;
    }>;
    wingFlavor?: string;
    meatChoice?: string;
    chefaSauces?: string[];
    special_instructions?: string;
  };
  notes?: string;
  originalItem?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { cartId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { cartId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType {
  items: CartItem[];
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(item => 
        item.id === action.payload.id && 
        JSON.stringify(item.customizations || {}) === JSON.stringify(action.payload.customizations || {})
      );
      
      if (existingItemIndex !== -1) {
        return {
          ...state,
          items: state.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, { 
          ...action.payload, 
          cartId: `${action.payload.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
        }]
      };
      
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.cartId !== action.payload.cartId)
      };
      
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.cartId === action.payload.cartId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
      
    case 'CLEAR_CART':
      return { ...state, items: [] };
      
    case 'LOAD_CART':
      return { ...state, items: action.payload || [] };
      
    default:
      return state;
  }
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { user } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const savedCart = localStorage.getItem(`damm_cart_${user.id}`);
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: cartData });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem(`damm_cart_${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`damm_cart_${user.id}`, JSON.stringify(state.items));
    }
  }, [state.items, user?.id]);

  const addToCart = (item: CartItem) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart.",
        variant: "destructive"
      });
      return;
    }

    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity || 1,
      image_url: item.image_url,
      customizations: item.customizations || {},
      notes: item.notes || '',
      // Store the original item data for reconstruction
      originalItem: {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image_url: item.image_url
      }
    };

    dispatch({ 
      type: 'ADD_ITEM', 
      payload: cartItem
    });

    toast({
      title: "Added to Cart! 🐺",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (cartId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { cartId } });
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { cartId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.removeItem(`damm_cart_${user.id}`);
    }
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      let itemPrice = Number(item.price);
      
      // Add customization costs if they exist
      if (item.customizations?.meat?.price_adjustment) {
        itemPrice += Number(item.customizations.meat.price_adjustment);
      }
      if (item.customizations?.sauces) {
        itemPrice += item.customizations.sauces.reduce((sauceTotal, sauce) => {
          return sauceTotal + Number(sauce.price_adjustment || 0);
        }, 0);
      }
      
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartItems = () => {
    return state.items.map(item => ({
      ...item,
      // Ensure compatibility with existing cart format
      modifiers: item.customizations ? {
        meat: item.customizations.meat || null,
        sauces: item.customizations.sauces || []
      } : { meat: null, sauces: [] }
    }));
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      cartItems: getCartItems(), // For backward compatibility
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      cartCount: getCartItemCount(),
      cartTotal: getCartTotal()
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export type { CartItem };
export default CartContext;
