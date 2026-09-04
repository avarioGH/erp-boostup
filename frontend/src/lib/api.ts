import axios from 'axios';

// Gunakan environment variable jika ada, jika tidak gunakan API Production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.erp.boostup.id';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token (Mock Auth Sementara)
api.interceptors.request.use((config) => {
  // Dalam production, ambil dari localStorage atau cookies
  const token = typeof window !== 'undefined' ? localStorage.getItem('erp_token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk menangani error respons
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const DashboardAPI = {
  getKPIs: async (timeRange: string = 'thisMonth', warehouseId: string = 'all') => {
    const res = await api.get('/analytics/dashboard', { params: { timeRange, warehouseId } });
    return res.data;
  },
};

export const InventoryAPI = {
  getCategories: async () => {
    const res = await api.get('/inventory/categories');
    return res.data;
  },
  getProducts: async () => {
    const res = await api.get('/inventory/products');
    return res.data;
  },
  getWarehouses: async () => {
    const res = await api.get('/inventory/warehouses');
    return res.data;
  },
  createProduct: async (data: any) => {
    const res = await api.post('/inventory/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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
  },
  getTransactions: async () => {
    const res = await api.get('/inventory/transactions');
    return res.data;
  }
};




export const B2BApi = {
  getQuotations: async (params?: any) => (await api.get('/sales/quotations', { params })).data,
  getQuotation: async (id: string) => (await api.get(/sales/quotations/$id)).data,
  createQuotation: async (data: any) => (await api.post('/sales/quotations', data)).data,
  confirmQuotation: async (id: string) => (await api.post(/sales/quotations/$id/confirm)).data,
  
  getOrders: async (params?: any) => (await api.get('/sales/orders', { params })).data,
  getOrder: async (id: string) => (await api.get(/sales/orders/$id)).data,
  
  getDeliveries: async (params?: any) => (await api.get('/sales/deliveries', { params })).data,
  getDelivery: async (id: string) => (await api.get(/sales/deliveries/$id)).data,
  validateDelivery: async (id: string) => (await api.post(/sales/deliveries/$id/validate)).data,

  getInvoices: async (params?: any) => (await api.get('/finance/invoices', { params })).data,
  getInvoice: async (id: string) => (await api.get(/finance/invoices/$id)).data,
  createInvoiceFromSO: async (data: any) => (await api.post('/finance/invoices/from-so', data)).data,
  postInvoice: async (id: string) => (await api.post(/finance/invoices/$id/post)).data,
  
  getPayments: async (params?: any) => (await api.get('/finance/payments', { params })).data,
  createPayment: async (data: any) => (await api.post('/finance/payments', data)).data,
};

export const PurchasingAPI = {
  getRFQs: async () => (await api.get('/purchasing/orders')).data,
  createRFQ: async (data: any) => (await api.post('/purchasing/rfq', data)).data,
  confirmRFQ: async (id: string) => (await api.post(/purchasing/rfq/ + id + /confirm)).data,
  getReceipts: async () => (await api.get('/purchasing/receipts')).data,
  receiveGoods: async (poId: string, data: any) => (await api.post(/purchasing/orders/ + poId + /receive, data)).data
};

export const VendorAPI = {
  createVendorBill: async (poId: string) => (await api.post('/finance/vendor-bills/from-po', { purchaseOrderId: poId })).data,
};
