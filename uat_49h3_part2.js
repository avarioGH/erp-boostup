const http = require('http');
const { PrismaClient } = require('@prisma/client');

async function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let out = '';
      res.on('data', d => out += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: out ? JSON.parse(out) : null }); }
        catch (e) { resolve({ status: res.statusCode, body: out }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

async function run() {
  const envContent = require('fs').readFileSync('.env', 'utf-8');
  const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
  const rawUrl = dbUrlLine.substring(dbUrlLine.indexOf('=') + 1).trim().replace(/['"]/g, '');
  const urlObj = new URL(rawUrl);
  urlObj.pathname = '/uat_erp';
  const uat = new PrismaClient({ datasources: { db: { url: urlObj.toString() } } });
  
  const UAT_COMPANY_ID = '6ab79d610c6db3e45bbdf53b';
  const uatWH = await uat.warehouse.findFirst({ where: { code: 'WH-UAT-49H' } });
  const uatLoc = await uat.location.findFirst({ where: { code: 'LOC-UAT-49H' } });
  const variant = await uat.timberVariant.findFirst({ where: { company_id: UAT_COMPANY_ID } });

  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'uat_admin_49h@boostup.id',
    password: 'password123'
  });
  const token = loginRes.body.access_token;
  
  const R = {};
  const ts = Date.now();

  // S11 - Sales Order
  // Let's create a Customer first if needed, or find one
  let customer = await uat.customer.findFirst({ where: { company_id: UAT_COMPANY_ID } });
  if (!customer) {
    customer = await uat.customer.create({ data: { company_id: UAT_COMPANY_ID, name: 'UAT Customer', code: 'C-UAT' } });
  }

  const soRes = await apiCall('POST', '/sales/timber-orders', {
    customerId: customer.id,
    orderDate: new Date().toISOString(),
    notes: 'UAT SO',
    items: [{
      timberVariantId: variant.id,
      thicknessMm: 20, widthMm: 100, lengthMm: 1000,
      grade: 'A', species: 'UAT',
      orderQty: 2
    }]
  }, token);
  
  R.s11_create = soRes.status;
  const soId = soRes.body && soRes.body.id;

  if (soId) {
    const confirmRes = await apiCall('POST', '/sales/timber-orders/' + soId + '/confirm', {}, token);
    R.s11_confirm = confirmRes.status;

    // S12 Shipment
    // Find a driver and vehicle
    let driver = await uat.driver.findFirst({ where: { company_id: UAT_COMPANY_ID } });
    if (!driver) driver = await uat.driver.create({ data: { company_id: UAT_COMPANY_ID, name: 'UAT Driver' } });
    let vehicle = await uat.vehicle.findFirst({ where: { company_id: UAT_COMPANY_ID } });
    if (!vehicle) vehicle = await uat.vehicle.create({ data: { company_id: UAT_COMPANY_ID, plate_number: 'UAT-123' } });

    // Wait, createDelivery expects what payload? Let's check timber-sales.controller.ts on VPS
  }
  
  console.log(JSON.stringify(R, null, 2));
}
run().catch(console.error);
