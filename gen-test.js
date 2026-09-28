const fs = require('fs');

const code = 
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  console.log('STARTING MINIMAL UAT');
  const token = jwt.sign(
    { userId: '6ab6bbbbda3dc137b74ac3df', sub: '6ab6bbbbda3dc137b74ac3df', email: 'uat_admin', roleId: '6ab6a254c7ee2dbcb45ff3b8', companyId: '6ab79d610c6db3e45bbdf53b' },
    '7A9B3E2F8C1D4A6E5B8F9C2D1A4E7B0C',
    { expiresIn: '1h' }
  );

  const api = axios.create({
    baseURL: 'http://localhost:5001',
    headers: { Authorization: 'Bearer ' + token }
  });

  const R = {};

  try {
    const uatWH = await uat.warehouse.findFirst({ where: { code: 'WH-UAT-49H' } });
    const uatLoc2 = await uat.warehouse.findFirst({ where: { company_id: '6ab79d610c6db3e45bbdf53b', id: { not: uatWH.id } } });
    const stock = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, currentPcs: { gt: 0 } } });

    if (!stock) throw new Error('No stock to test');

    // 1. Adjustment
    console.log('1. Testing Adjustment');
    const adj = await api.post('/inventory/adjustments', {
      adjustmentDate: new Date().toISOString(),
      locationId: uatWH.id,
      reason: 'UAT_TEST_ADJ',
      items: [{
        timberVariantId: stock.timberVariantId,
        systemPcs: stock.currentPcs,
        differencePcs: 10,
        differenceM3: 0.02
      }]
    });
    let status = await api.post('/inventory/adjustments/' + adj.data.id + '/post');
    R.adj_pos_confirm = status.status;
    status = await api.post('/inventory/adjustments/' + adj.data.id + '/cancel');
    R.adj_pos_cancel = status.status;

    // 2. Transfer
    console.log('2. Testing Transfer');
    const trf = await api.post('/inventory/transfers', {
      transferDate: new Date().toISOString(),
      fromLocationId: uatWH.id,
      toLocationId: uatLoc2.id,
      notes: 'UAT_TRF',
      items: [{
        timberVariantId: stock.timberVariantId,
        quantityPcs: 1,
        volumeM3: 0.001
      }]
    });
    status = await api.post('/inventory/transfers/' + trf.data.id + '/post');
    R.trf_confirm = status.status;
    status = await api.post('/inventory/transfers/' + trf.data.id + '/cancel');
    R.trf_cancel = status.status;

    // 3. Production
    console.log('3. Testing Production');
    const prd = await api.post('/inventory/production', {
      company_id: '6ab79d610c6db3e45bbdf53b',
      processType: 'GESEK',
      processDate: new Date().toISOString(),
      inputs: [{
        timberStockId: stock.id,
        variantId: stock.timberVariantId,
        quantityPCS: 2,
        volumeM3: 0.002
      }],
      outputs: [{
        variantId: stock.timberVariantId,
        outputType: 'PRODUCT',
        quantityPCS: 1,
        volumeM3: 0.001,
        warehouseId: uatWH.id
      }]
    });
    status = await api.put('/inventory/production/' + prd.data.id + '/confirm');
    R.prd_confirm = status.status;
    status = await api.put('/inventory/production/' + prd.data.id + '/cancel');
    R.prd_cancel = status.status;

    console.log('ALL TESTS PASSED');
    R.success = true;
  } catch (e) {
    R.success = false;
    R.error = e.response ? e.response.data : e.message;
  }

  console.log('MINIMAL_RESULT_JSON');
  console.log(JSON.stringify(R, null, 2));

  await prod.\\();
  await uat.\\();
}
run();
;
fs.writeFileSync('test-minimal.js', code);
