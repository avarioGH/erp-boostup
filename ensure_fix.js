const fs = require("fs");

let content = `import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export const AuthAPI = {
  login: async (data: any) => (await api.post('/auth/login', data)).data,
  register: async (data: any) => (await api.post('/auth/register', data)).data,
  getProfile: async () => (await api.get('/auth/profile')).data,
};

export const CompanyAPI = {
  getCompanies: async () => (await api.get('/companies')).data,
  getBranches: async () => (await api.get('/branches')).data,
};

export const UserAPI = {
  getUsers: async () => (await api.get('/users')).data,
  getRoles: async () => (await api.get('/roles')).data,
};

export const CRMAPI = {
  getCustomers: async () => (await api.get('/crm/customers')).data,
  getLeads: async () => (await api.get('/crm/leads')).data,
  getOpportunities: async () => (await api.get('/crm/opportunities')).data,
  convertLead: async (id: string) => (await api.post("/crm/leads/" + id + "/convert")).data,
  getCustomer360: async (id: string) => (await api.get("/crm/customers/" + id + "/360")).data,
};

export const InventoryAPI = {
  getDashboard: async (timeRange: string, warehouseId?: string) => {
    const params: any = { timeRange };
    if (warehouseId) params.warehouseId = warehouseId;
    return (await api.get('/analytics/dashboard', { params })).data;
  },
  getCategories: async () => (await api.get('/inventory/categories')).data,
  getProducts: async () => (await api.get('/inventory/products')).data,
  getWarehouses: async () => (await api.get('/inventory/warehouses')).data,
  createProduct: async (data: any) => (await api.post('/inventory/products', data)).data,
  createWarehouse: async (data: any) => (await api.post('/inventory/warehouses', data)).data,
  getTransactions: async () => (await api.get('/inventory/transactions')).data,
};

export const SalesAPI = {
  getQuotations: async (params?: any) => (await api.get('/sales/quotations', { params })).data,
  getQuotation: async (id: string) => (await api.get("/sales/quotations/" + id)).data,
  createQuotation: async (data: any) => (await api.post('/sales/quotations', data)).data,
  confirmQuotation: async (id: string) => (await api.post("/sales/quotations/" + id + "/confirm")).data,
  
  getOrders: async (params?: any) => (await api.get('/sales/orders', { params })).data,
  getOrder: async (id: string) => (await api.get("/sales/orders/" + id)).data,
  
  getDeliveries: async (params?: any) => (await api.get('/sales/deliveries', { params })).data,
  getDelivery: async (id: string) => (await api.get("/sales/deliveries/" + id)).data,
  validateDelivery: async (id: string) => (await api.post("/sales/deliveries/" + id + "/validate")).data,
};

export const FinanceAPI = {
  getInvoices: async (params?: any) => (await api.get('/finance/invoices', { params })).data,
  getInvoice: async (id: string) => (await api.get("/finance/invoices/" + id)).data,
  createInvoiceFromSO: async (data: any) => (await api.post('/finance/invoices/from-so', data)).data,
  postInvoice: async (id: string) => (await api.post("/finance/invoices/" + id + "/post")).data,
  
  getPayments: async (params?: any) => (await api.get('/finance/payments', { params })).data,
  createPayment: async (data: any) => (await api.post('/finance/payments', data)).data,
};

export const PurchasingAPI = {
  getRFQs: async () => (await api.get('/purchasing/orders')).data,
  createRFQ: async (data: any) => (await api.post('/purchasing/rfq', data)).data,
  confirmRFQ: async (id: string) => (await api.post("/purchasing/rfq/" + id + "/confirm")).data,
  getReceipts: async () => (await api.get('/purchasing/receipts')).data,
  receiveGoods: async (poId: string, data: any) => (await api.post("/purchasing/orders/" + poId + "/receive", data)).data
};

export const VendorAPI = {
  createVendorBill: async (poId: string) => (await api.post('/finance/vendor-bills/from-po', { purchaseOrderId: poId })).data,
};`;

fs.writeFileSync("frontend/src/lib/api.ts", content);

let code2 = fs.readFileSync("frontend/src/app/inventory/adjustments/page.tsx", "utf8");
code2 = code2.replace(/api\.post\([^\)]*\/validate\)/g, "api.post('/inventory/adjustment/' + id + '/validate')");
fs.writeFileSync("frontend/src/app/inventory/adjustments/page.tsx", code2);

let code3 = fs.readFileSync("frontend/src/app/inventory/transfers/page.tsx", "utf8");
code3 = code3.replace(/api\.post\([^\)]*\/validate\)/g, "api.post('/inventory/transfer/' + id + '/validate')");
fs.writeFileSync("frontend/src/app/inventory/transfers/page.tsx", code3);

console.log("api.ts tails:");
console.log(content.slice(-500));
console.log("adj tails:");
console.log(code2.slice(-500));

