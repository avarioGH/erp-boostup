const fs = require("fs");
let apiCode = fs.readFileSync("frontend/src/lib/api.ts", "utf8");

apiCode = apiCode.replace("api.get(/sales/deliveries/$id)", "api.get(`/sales/deliveries/${id}`)");
apiCode = apiCode.replace("api.post(/sales/deliveries/$id/validate)", "api.post(`/sales/deliveries/${id}/validate`)");
apiCode = apiCode.replace("api.get(/finance/invoices/$id)", "api.get(`/finance/invoices/${id}`)");
apiCode = apiCode.replace("api.post(/finance/invoices/$id/post)", "api.post(`/finance/invoices/${id}/post`)");
apiCode = apiCode.replace("api.post(/purchasing/rfq/ + id + /confirm)", "api.post(`/purchasing/rfq/${id}/confirm`)");
apiCode = apiCode.replace("api.post(/purchasing/orders/ + poId + /receive, data)", "api.post(`/purchasing/orders/${poId}/receive`, data)");
apiCode = apiCode.replace("api.get(/sales/quotations/$id)", "api.get(`/sales/quotations/${id}`)");
apiCode = apiCode.replace("api.post(/sales/quotations/$id/confirm)", "api.post(`/sales/quotations/${id}/confirm`)");
apiCode = apiCode.replace("api.get(/sales/orders/$id)", "api.get(`/sales/orders/${id}`)");

const append = `
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
  convertLead: async (id: string) => (await api.post(\`/crm/leads/${id}/convert\`)).data,
  getCustomer360: async (id: string) => (await api.get(\`/crm/customers/${id}/360\`)).data,
};

export const PosAPI: any = {
  getProducts: async () => (await api.get('/pos/products')).data,
  createTransaction: async (data: any) => (await api.post('/pos/transactions', data)).data,
};

export const FinanceAPI: any = {
  getInvoices: async (params?: any) => (await api.get('/finance/invoices', { params })).data,
  getInvoice: async (id: string) => (await api.get(\`/finance/invoices/${id}\`)).data,
  createInvoiceFromSO: async (data: any) => (await api.post('/finance/invoices/from-so', data)).data,
  postInvoice: async (id: string) => (await api.post(\`/finance/invoices/${id}/post\`)).data,
  getPayments: async (params?: any) => (await api.get('/finance/payments', { params })).data,
  createPayment: async (data: any) => (await api.post('/finance/payments', data)).data,
  getTransactions: async () => [],
  getSummary: async () => ({ cashInHand: 0, cashInBank: 0 }),
};
`;

apiCode += append;

apiCode = apiCode.replace(/export const DashboardAPI =/g, "export const DashboardAPI: any =");
apiCode = apiCode.replace(/export const InventoryAPI =/g, "export const InventoryAPI: any =");
apiCode = apiCode.replace(/export const B2BApi =/g, "export const B2BApi: any =");
apiCode = apiCode.replace(/export const PurchasingAPI =/g, "export const PurchasingAPI: any =");
apiCode = apiCode.replace(/export const VendorAPI =/g, "export const VendorAPI: any =");

fs.writeFileSync("frontend/src/lib/api.ts", apiCode);
