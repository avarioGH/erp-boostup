import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.erp.boostup.id';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('erp_token') : null;
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

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

export const DashboardAPI: any = {
  getKPIs: async (timeRange: string = 'thisMonth', warehouseId: string = 'all') => {
    const res = await api.get('/analytics/dashboard', { params: { timeRange, warehouseId } });
    return res.data;
  },
};

export const InventoryAPI: any = {
  getCategories: async () => (await api.get('/inventory/categories')).data,
  getProducts: async () => (await api.get('/inventory/products')).data,
  getWarehouses: async () => (await api.get('/inventory/warehouses')).data,
  createProduct: async (data: any) => (await api.post('/inventory/products', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  createWarehouse: async (data: any) => (await api.post('/inventory/warehouses', data)).data,
  updateWarehouse: async (id: string, data: any) => (await api.put("/inventory/warehouses/" + id, data)).data,
  deleteWarehouse: async (id: string) => (await api.delete("/inventory/warehouses/" + id)).data,
  getTransactions: async () => (await api.get('/inventory/transactions')).data
};

export const B2BApi: any = {
  getQuotations: async (params?: any) => (await api.get('/sales/quotations', { params })).data,
  getQuotation: async (id: string) => (await api.get("/sales/quotations/" + id)).data,
  createQuotation: async (data: any) => (await api.post('/sales/quotations', data)).data,
  confirmQuotation: async (id: string) => (await api.post("/sales/quotations/" + id + "/confirm")).data,
  getOrders: async (params?: any) => (await api.get('/sales/orders', { params })).data,
  getOrder: async (id: string) => (await api.get("/sales/orders/" + id)).data,
  getDeliveries: async (params?: any) => (await api.get('/sales/deliveries', { params })).data,
  getDelivery: async (id: string) => (await api.get("/sales/deliveries/" + id)).data,
  validateDelivery: async (id: string) => (await api.post("/sales/deliveries/" + id + "/validate")).data,
  getInvoices: async (params?: any) => (await api.get('/finance/invoices', { params })).data,
  getInvoice: async (id: string) => (await api.get("/finance/invoices/" + id)).data,
  createInvoiceFromSO: async (data: any) => (await api.post('/finance/invoices/from-so', data)).data,
  postInvoice: async (id: string) => (await api.post("/finance/invoices/" + id + "/post")).data,
  getPayments: async (params?: any) => (await api.get('/finance/payments', { params })).data,
  createPayment: async (data: any) => (await api.post('/finance/payments', data)).data,
};

export const PurchasingAPI: any = {
  getRFQs: async () => (await api.get('/purchasing/orders')).data,
  createRFQ: async (data: any) => (await api.post('/purchasing/rfq', data)).data,
  confirmRFQ: async (id: string) => (await api.post("/purchasing/rfq/" + id + "/confirm")).data,
  getReceipts: async () => (await api.get('/purchasing/receipts')).data,
  receiveGoods: async (poId: string, data: any) => (await api.post("/purchasing/orders/" + poId + "/receive", data)).data
};

export const VendorAPI: any = {
  createVendorBill: async (poId: string) => (await api.post('/finance/vendor-bills/from-po', { purchaseOrderId: poId })).data,
};

export const AuthAPI: any = {
  login: async (data: any) => (await api.post('/auth/login', data)).data,
  register: async (data: any) => (await api.post('/auth/register', data)).data,
  getProfile: async () => (await api.get('/auth/profile')).data,
};

export const CompanyAPI: any = {
  getCompanies: async () => (await api.get('/companies')).data,
  getBranches: async () => (await api.get('/branches')).data,
};

export const UserAPI: any = {
  getUsers: async () => (await api.get('/users')).data,
  getRoles: async () => (await api.get('/roles')).data,
};

export const CRMAPI: any = {
  getCustomers: async () => (await api.get('/crm/customers')).data,
  getLeads: async () => (await api.get('/crm/leads')).data,
  getOpportunities: async () => (await api.get('/crm/opportunities')).data,
  convertLead: async (id: string) => (await api.post("/crm/leads/" + id + "/convert")).data,
  getCustomer360: async (id: string) => (await api.get("/crm/customers/" + id + "/360")).data,
};

export const PosAPI: any = {
  getProducts: async () => (await api.get('/pos/products')).data,
  createTransaction: async (data: any) => (await api.post('/pos/transactions', data)).data,
};

export const FinanceAPI: any = {
  getInvoices: async (params?: any) => (await api.get('/finance/invoices', { params })).data,
  getInvoice: async (id: string) => (await api.get("/finance/invoices/" + id)).data,
  createInvoiceFromSO: async (data: any) => (await api.post('/finance/invoices/from-so', data)).data,
  postInvoice: async (id: string) => (await api.post("/finance/invoices/" + id + "/post")).data,
  getPayments: async (params?: any) => (await api.get('/finance/payments', { params })).data,
  createPayment: async (data: any) => (await api.post('/finance/payments', data)).data,
  getTransactions: async () => [],
  getSummary: async () => ({ cashInHand: 0, cashInBank: 0 }),
};
