const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function req(path, method, body, token) {
  const res = await fetch('http://localhost:3001' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { data = text; } console.log(method, path, res.status, text);
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function run() {
  console.log('STARTING MINIMAL UAT');
  const loginRes = await fetch('http://localhost:3001/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'uat_admin', password: 'uatpassword' }) }); const loginData = await loginRes.json(); console.log('LOGIN_RES', loginData); const token = loginData.data ? loginData.data.access_token : loginData.access_token;

  const R = {};
  try {
    const uatWH = await uat.warehouse.findFirst({ where: { code: 'WH-UAT-49H' } });
    let uatLoc2 = await uat.warehouse.findFirst({ where: { company_id: '6ab79d610c6db3e45bbdf53b', id: { not: uatWH.id } } }); if (!uatLoc2) { uatLoc2 = await uat.warehouse.create({ data: { company_id: '6ab79d610c6db3e45bbdf53b', code: 'WH-UAT-2', name: 'UAT WH 2' } }); }
    const stock = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, currentPcs: { gt: 1 } } });

    if (!stock) throw new Error('No stock to test');

    console.log('1. Testing Adjustment');
    const adj = await req('/inventory/adjustments', 'POST', {
      adjustmentDate: new Date().toISOString(),
      locationId: uatWH.id,
      reason: 'UAT_TEST_ADJ',
      items: [{ timberVariantId: stock.timberVariantId, systemPcs: stock.currentPcs, differencePcs: 10, differenceM3: 0.02 }]
    }, token);
    await req('/inventory/adjustments/' + adj.id + '/post', 'POST', null, token);
    R.adj_pos_confirm = 201;
    await req('/inventory/adjustments/' + adj.id + '/cancel', 'POST', null, token);
    R.adj_pos_cancel = 201;

    console.log('2. Testing Transfer');
    const trf = await req('/inventory/transfers', 'POST', {
      transferDate: new Date().toISOString(),
      fromLocationId: uatWH.id,
      toLocationId: uatLoc2.id,
      notes: 'UAT_TRF',
      items: [{ timberVariantId: stock.timberVariantId, quantityPcs: 1, volumeM3: 0.001 }]
    }, token);
    console.log('trf', trf); await req('/inventory/transfers/' + trf.id + '/post', 'POST', null, token);
    R.trf_confirm = 201;
    await req('/inventory/transfers/' + trf.id + '/cancel', 'POST', null, token);
    R.trf_cancel = 201;

    console.log('3. Testing Production');
    const prd = await req('/inventory/production', 'POST', {
      company_id: '6ab79d610c6db3e45bbdf53b',
      processType: 'GESEK',
      processDate: new Date().toISOString(),
      inputs: [{ timberStockId: stock.id, variantId: stock.timberVariantId, quantityPCS: 2, volumeM3: 0.002 }],
      outputs: [{ variantId: stock.timberVariantId, outputType: 'PRODUCT', quantityPCS: 1, volumeM3: 0.001, warehouseId: uatWH.id }]
    }, token);
    await req('/inventory/production/' + prd.id + '/confirm', 'PUT', null, token);
    R.prd_confirm = 200;
    await req('/inventory/production/' + prd.id + '/cancel', 'PUT', null, token);
    R.prd_cancel = 200;

    R.success = true;
  } catch (e) {
    R.success = false;
    R.error = e.message;
  }

  console.log('MINIMAL_RESULT_JSON_START');
  console.log(JSON.stringify(R, null, 2));

  await prod.$disconnect();
  await uat.$disconnect();
}
run();
