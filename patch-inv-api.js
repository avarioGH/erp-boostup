const fs = require('fs');
const path = 'frontend/src/lib/api.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "getProducts: async (params?: any) => (await api.get('/inventory/products', { params })).data,",
  "getProducts: async (params?: any) => (await api.get('/inventory/products', { params })).data,\n    getStockInTallies: async () => (await api.get('/inventory/stock-in-tally')).data,\n    createStockInTally: async (data: any) => (await api.post('/inventory/stock-in-tally', data)).data,\n    deleteStockInTally: async (id: string) => (await api.delete('/inventory/stock-in-tally/' + id)).data,"
);

fs.writeFileSync(path, content, 'utf8');
