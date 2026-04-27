import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface AppState {
  cart: CartItem[];
  bcv: number;
  darkMode: boolean;
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setBCV: (rate: number) => void;
  toggleDarkMode: () => void;
  fetchBCV: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  cart: [],
  bcv: 0,
  darkMode: false,

  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => set({ cart: [] }),
  setBCV: (rate) => set({ bcv: rate }),
  toggleDarkMode: () => set({ darkMode: !get().darkMode }),

  fetchBCV: async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('bcv_rate')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        set({ bcv: parseFloat(data.bcv_rate) });
      }
    } catch (error) {
      console.error('Error fetching BCV:', error);
    }
  }
}));
