import { create } from 'zustand';
import { Product } from '../services/productService';

interface CartItem extends Product {
  quantity: number;
}

interface AppState {
  bcv: number;
  setBcv: (val: number) => void;
  
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart: () => void;
  
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  bcv: 0,
  setBcv: (val) => set({ bcv: val }),
  
  cart: [],
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  
  updateQuantity: (productId, delta) => set((state) => ({
    cart: state.cart.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0)
  })),
  
  clearCart: () => set({ cart: [] }),
  
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
