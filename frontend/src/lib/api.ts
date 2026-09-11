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
  getTransactions: async () => (await api.get('/inventory/transactions')).data,
  getStocks: async () => (await api.get('/inventory/stocks')).data,
  getMovements: async () => (await api.get('/inventory/movements')).data
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
};

export const PurchasingAPI: any = {
  getRequests: async (params?: any) => (await api.get('/purchasing/requests', { params })).data,
  createRequest: async (data: any) => (await api.post('/purchasing/requests', data)).data,
  getRFQs: async () => (await api.get('/purchasing/orders', { params: { page: 1, limit: 100 } })).data,
  createRFQ: async (data: any) => (await api.post('/purchasing/rfq', data)).data,
  confirmRFQ: async (id: string) => (await api.post('/purchasing/rfq/' + id + '/confirm')).data,
  getOrders: async (params?: any) => (await api.get('/purchasing/orders', { params })).data,
  getOrder: async (id: string) => (await api.get('/purchasing/orders/' + id)).data,
  getReceipts: async () => (await api.get('/purchasing/receipts')).data,
  getReceipt: async (id: string) => (await api.get('/purchasing/receipts/' + id)).data,
  receiveGoods: async (poId: string, data: any) => (await api.post('/purchasing/orders/' + poId + '/receive', data)).data,
  getAnalytics: async () => (await api.get('/purchasing/analytics')).data,
  getVendorComparison: async (productId: string) => (await api.get('/purchasing/products/' + productId + '/vendor-comparison')).data,
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
  checkout: async (data: any) => (await api.post('/pos/transactions', data)).data,
  getShifts: async () => (await api.get('/pos/shifts')).data,
  openShift: async (data: any) => (await api.post('/pos/shifts/open', data)).data,
  closeShift: async (data: any) => (await api.post('/pos/shifts/close', data)).data,
  getOrderHistory: async (params?: any) => (await api.get('/pos/transactions', { params })).data,
};

export const FinanceAPI: any = {
  getInvoices: async (params?: any) => (await api.get('/finance/invoices', { params })).data,
  getInvoice: async (id: string) => (await api.get("/finance/invoices/" + id)).data,
  createInvoiceFromSO: async (data: any) => (await api.post('/finance/invoices/from-so', data)).data,
  postInvoice: async (id: string) => (await api.post("/finance/invoices/" + id + "/post")).data,
  getPayments: async (params?: any) => (await api.get('/finance/payments', { params })).data,
  createPayment: async (data: any) => (await api.post('/finance/payments', data)).data,
  getTransactions: async () => (await api.get('/finance/transactions').catch(() => ({ data: [] }))).data,
  getSummary: async () => (await api.get('/finance/summary').catch(() => ({ data: { cashInHand: 0, cashInBank: 0 } }))).data,
  getCategories: async () => (await api.get('/finance/categories').catch(() => ({ data: [] }))).data,
  getBalanceSheetReport: async (params?: any) => (await api.get('/reports/finance/balance-sheet', { params }).catch(() => ({ data: {} }))).data,
  getCashFlowReport: async (params?: any) => (await api.get('/reports/finance/cash-flow', { params }).catch(() => ({ data: {} }))).data,
  getProfitLossReport: async (params?: any) => (await api.get('/reports/finance/profit-loss', { params }).catch(() => ({ data: {} }))).data,
  createVendorBill: async (poId: string) => (await api.post('/purchasing/orders/' + poId + '/bill', {})).data,
};
export const HrAPI: any = {
  getDepartments: async () => (await api.get('/hr/departments')).data,
  getEmployees: async () => (await api.get('/hr/employees')).data,
  createEmployee: async (data: any) => (await api.post('/hr/employees', data)).data,
  updateEmployee: async (id: string, data: any) => (await api.put('/hr/employees/' + id, data)).data,
  registerBiometric: async (id: string, data: any) => (await api.post('/hr/employees/' + id + '/biometric', data)).data,
  getLeaves: async () => (await api.get('/hr/leaves')).data,
  createLeave: async (data: any) => (await api.post('/hr/leaves', data)).data,
  getAttendances: async () => (await api.get('/hr/attendance')).data,
  clockAttendance: async (data: any) => (await api.post('/hr/attendance/clock', data)).data,
  getPayrolls: async () => (await api.get('/hr/payroll')).data,
  createPayroll: async (data: any) => (await api.post('/hr/payroll', data)).data,
  calculatePayroll: async (employeeId: string, period: string) => (await api.post('/hr/payroll/' + employeeId + '/calculate', { period })).data,
  postPayroll: async (id: string) => (await api.post('/hr/payroll/' + id + '/post')).data,
};
export const ExpenseAPI: any = {
  getClaims: async (params?: any) => (await api.get('/expense', { params })).data,
  getClaim: async (id: string) => (await api.get('/expense/' + id)).data,
  createClaim: async (data: any) => (await api.post('/expense', data)).data,
  submitClaim: async (id: string) => (await api.post('/expense/' + id + '/submit')).data,
  approveClaim: async (id: string) => (await api.post('/expense/' + id + '/approve')).data,
  postClaim: async (id: string) => (await api.post('/expense/' + id + '/post')).data,
};
export const AssetAPI: any = {
  getAssets: async () => (await api.get('/asset')).data,
  createAsset: async (data: any) => (await api.post('/asset', data)).data,
  requestBorrow: async (data: any) => (await api.post('/asset/borrow', data)).data,
  approveBorrow: async (id: string) => (await api.post('/asset/borrow/' + id + '/approve')).data,
  getAssetFinancials: async (id: string) => (await api.get('/finance/asset/' + id + '/financials')).data,
  capitalizeAsset: async (id: string, data: any) => (await api.post('/finance/asset/' + id + '/capitalize', data)).data,
  postDepreciation: async (id: string, period: string) => (await api.post('/finance/asset/' + id + '/depreciate', { period })).data,
  disposeAsset: async (id: string, data: any) => (await api.post('/finance/asset/' + id + '/dispose', data)).data,
};
export const ApprovalAPI: any = {
  getPendingApprovals: async () => (await api.get('/approval/pending')).data,
  requestApproval: async (data: any) => (await api.post('/approval', data)).data,
  approve: async (id: string, note?: string) => (await api.post('/approval/' + id + '/approve', { note })).data,
  reject: async (id: string, note?: string) => (await api.post('/approval/' + id + '/reject', { note })).data,
  cancel: async (id: string) => (await api.post('/approval/' + id + '/cancel')).data,
};
export default api;

export const TimberAPI: any = {
  getDashboardSummary: async () => (await api.get('/inventory/reports/summary')).data,
  getStockSummary: async (params?: any) => (await api.get('/inventory/reports/stock-summary', { params })).data,
  getRawLogs: async (params?: any) => (await api.get('/inventory/logs', { params })).data,
  getRawLog: async (id: string) => (await api.get('/inventory/logs/' + id)).data,
  getTrimmedLogs: async (params?: any) => (await api.get('/inventory/trimming', { params })).data,
  getTrimmedLog: async (id: string) => (await api.get('/inventory/trimming/' + id)).data,
  getRawLogTrimming: async (rawLogId: string) => (await api.get('/inventory/logs/' + rawLogId + '/trimming')).data,
  createTrimmedLog: async (rawLogId: string, data: any) => (await api.post('/inventory/logs/' + rawLogId + '/trimming', data)).data,
  cancelTrimmedLog: async (id: string) => (await api.post('/inventory/trimming/' + id + '/cancel')).data,
    getInputLogs: async (params?: any) => (await api.get('/inventory/input-logs', { params })).data,
  getInputLog: async (id: string) => (await api.get('/inventory/input-logs/' + id)).data,
  getAvailableTrimmedLogs: async () => (await api.get('/inventory/input-logs/available-trimmed-logs')).data,
  createInputLog: async (data: any) => (await api.post('/inventory/input-logs', data)).data,
  cancelInputLog: async (id: string) => (await api.post('/inventory/input-logs/' + id + '/cancel')).data,
    getSawnOutputs: async (params?: any) => (await api.get('/inventory/sawn-timber/output', { params })).data,
  getSawnOutput: async (id: string) => (await api.get('/inventory/sawn-timber/output/' + id)).data,
  createSawnOutput: async (data: any) => (await api.post('/inventory/sawn-timber/output', data)).data,
  postSawnOutput: async (id: string) => (await api.post('/inventory/sawn-timber/output/' + id + '/post')).data,
  cancelSawnOutput: async (id: string) => (await api.post('/inventory/sawn-timber/output/' + id + '/cancel')).data,
    getMovements: async (params?: any) => (await api.get('/inventory/movements', { params })).data,
  
  getTransfers: async (params?: any) => (await api.get('/inventory/transfers', { params })).data,
  getTransfer: async (id: string) => (await api.get('/inventory/transfers/' + id)).data,
  createTransfer: async (data: any) => (await api.post('/inventory/transfers', data)).data,
  postTransfer: async (id: string) => (await api.post('/inventory/transfers/' + id + '/post')).data,
  cancelTransfer: async (id: string) => (await api.post('/inventory/transfers/' + id + '/cancel')).data,
  
  getAdjustments: async (params?: any) => (await api.get('/inventory/adjustments', { params })).data,
  getAdjustment: async (id: string) => (await api.get('/inventory/adjustments/' + id)).data,
    uploadImport: async (formData: FormData) => (await api.post('/inventory/import/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  previewImport: async (id: string, data: any) => (await api.post('/inventory/import/' + id + '/preview', data)).data,
  executeImport: async (id: string, data: any) => (await api.post('/inventory/import/' + id + '/execute', data)).data,
  getImportHistory: async (params?: any) => (await api.get('/inventory/import/history', { params })).data,
  createAdjustment: async (data: any) => (await api.post('/inventory/adjustments', data)).data,
  postAdjustment: async (id: string) => (await api.post('/inventory/adjustments/' + id + '/post')).data,
  cancelAdjustment: async (id: string) => (await api.post('/inventory/adjustments/' + id + '/cancel')).data,
  getTimberStock: async (params?: any) => (await api.get('/inventory/sawn-timber/stock', { params })).data,
  createRawLog: async (data: any) => (await api.post('/inventory/logs', data)).data,
  cancelRawLog: async (id: string) => (await api.post('/inventory/logs/' + id + '/cancel')).data,
};







export const SawmillProductionAPI: any = {
  getRuns: async (params?: any) => (await api.get('/production/sawmill/runs', { params })).data,
  getRun: async (id: string) => (await api.get(`/production/sawmill/runs/${id}`)).data,
  createRun: async (data: any) => (await api.post('/production/sawmill/runs', data)).data,
  updateRun: async (id: string, data: any) => (await api.patch(`/production/sawmill/runs/${id}`, data)).data,
  postRun: async (id: string, data: { locationId: string }) => (await api.post(`/production/sawmill/runs/${id}/post`, data)).data,
  cancelRun: async (id: string, data: { locationId: string }) => (await api.post(`/production/sawmill/runs/${id}/cancel`, data)).data,
  getAvailableInputLogs: async () => (await api.get('/production/sawmill/input-logs/available')).data,
  getBundle: async (id: string) => (await api.get(`/production/sawmill/bundles/${id}`)).data,
};
