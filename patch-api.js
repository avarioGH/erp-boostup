const fs = require('fs');
const path = 'frontend/src/lib/api.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('exportShipment: {')) {
  const newApi = `
export const exportShipment = {
  getAll: async () => (await api.get('/sales/export-shipments')).data,
  getOne: async (id: string) => (await api.get('/sales/export-shipments/' + id)).data,
  create: async (data: any) => (await api.post('/sales/export-shipments', data)).data,
  update: async (id: string, data: any) => (await api.put('/sales/export-shipments/' + id, data)).data,
  delete: async (id: string) => (await api.delete('/sales/export-shipments/' + id)).data,
};
`;
  content = content + newApi;
  fs.writeFileSync(path, content, 'utf8');
}
