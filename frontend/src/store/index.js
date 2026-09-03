import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('pos_token', data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    set({ user: null, token: null });
  },
}));

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  customer: '',

  addItem: (product, qty = 1) => {
    const { items } = get();
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      set({
        items: items.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      });
    } else {
      set({
        items: [...items, {
          product_id: product.id,
          name: product.name,
          barcode: product.barcode,
          unit_price: product.selling_price,
          quantity: qty,
          discount_pct: product.discount_pct || 0,
          tax_rate: product.tax_rate || 0,
          stock_qty: product.stock_qty,
          unit: product.unit,
        }]
      });
    }
  },

  removeItem: (product_id) => set({ items: get().items.filter(i => i.product_id !== product_id) }),

  updateQty: (product_id, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter(i => i.product_id !== product_id) });
    } else {
      set({ items: get().items.map(i => i.product_id === product_id ? { ...i, quantity } : i) });
    }
  },

  updateDiscount: (product_id, discount_pct) => {
    set({ items: get().items.map(i => i.product_id === product_id ? { ...i, discount_pct } : i) });
  },

  setDiscount: (discount) => set({ discount }),
  setCustomer: (customer) => set({ customer }),

  clearCart: () => set({ items: [], discount: 0, customer: '' }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  },

  getItemDiscount: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + (i.unit_price * i.quantity * (i.discount_pct || 0) / 100), 0);
  },

  getTax: () => {
    const { items } = get();
    return items.reduce((sum, i) => {
      const lineAfterDiscount = i.unit_price * i.quantity * (1 - (i.discount_pct || 0) / 100);
      return sum + lineAfterDiscount * (i.tax_rate || 0) / 100;
    }, 0);
  },

  getTotal: () => {
    const { getSubtotal, getItemDiscount, getTax, discount } = get();
    return getSubtotal() - getItemDiscount() - discount + getTax();
  },
}));

export const useSettingsStore = create((set, get) => ({
  settings: {},
  loaded: false,
  fetchSettings: async () => {
    if (get().loaded) return;
    try {
      const { data } = await api.get('/settings');
      set({ settings: data, loaded: true });
    } catch {}
  },
}));
