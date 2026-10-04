const fs = require('fs');
let c = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');
c = c.replace(
  "getDeliveries: async (params?: any) => (await api.get('/sales/deliveries', { params })).data,",
  "getDeliveries: async (params?: any) => (await api.get('/sales/deliveries', { params })).data,\n    createDelivery: async (soId: string, data: any) => (await api.post('/sales/deliveries/' + soId, data)).data,"
);
fs.writeFileSync('frontend/src/lib/api.ts', c);
