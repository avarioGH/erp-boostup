const fs = require('fs');
const path = 'frontend/src/lib/api.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "getOrders: async (params?: any) => (await api.get('/sales/orders', { params })).data,",
  "getOrders: async (params?: any) => (await api.get('/sales/orders', { params })).data,\n    createOrder: async (data: any) => (await api.post('/sales/orders', data)).data,"
);

fs.writeFileSync(path, content, 'utf8');
