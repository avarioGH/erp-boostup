import axios from 'axios';

// Gunakan environment variable jika ada, jika tidak gunakan VPS IP
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://194.233.85.181:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token (Mock Auth Sementara)
api.interceptors.request.use((config) => {
  // Dalam production, ambil dari localStorage atau cookies
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // DEV MODE: Kita kirim dummy headers agar backend (yang tidak strict) bisa baca user
    // (Jika backend strict menggunakan JWT, kita perlu endpoint /auth/login)
  }
  return config;
});

// API Endpoints
export const DashboardAPI = {
  getKPIs: async (timeRange: string = 'thisMonth', warehouseId: string = 'all') => {
    const res = await api.get('/analytics/dashboard', { params: { timeRange, warehouseId } });
    return res.data;
  },
};

export const InventoryAPI = {
  getProducts: async () => {
    const res = await api.get('/inventory/products');
    return res.data;
  },
  getWarehouses: async () => {
    const res = await api.get('/inventory/warehouses');
    return res.data;
  },
  createProduct: async (data: any) => {
    const res = await api.post('/inventory/products', data);
    return res.data;
  },
  createWarehouse: async (data: any) => {
    const res = await api.post('/inventory/warehouses', data);
    return res.data;
  },
  updateWarehouse: async (id: string, data: any) => {
    const res = await api.put(`/inventory/warehouses/${id}`, data);
    return res.data;
  },
  deleteWarehouse: async (id: string) => {
    const res = await api.delete(`/inventory/warehouses/${id}`);
    return res.data;
  }
};

export const FinanceAPI = {
  getCategories: async () => {
    const res = await api.get('/finance/categories');
    return res.data;
  }
};

export const PosAPI = {
  checkout: async (payload: any) => {
    const res = await api.post('/pos/checkout', payload);
    return res.data;
  }
};
