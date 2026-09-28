const { PrismaClient } = require('@prisma/client');
const http = require('http');

const uat = new PrismaClient({ datasources: { db: { url: 'mongodb://avario-user:AvarioMongoDB2023!@localhost:27017/uat_erp?authSource=admin&replicaSet=rs0' } } });
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb://avario-user:AvarioMongoDB2023!@localhost:27017/boostup?authSource=admin&replicaSet=rs0' } } });

const UAT_COMPANY_ID = '6ab79d610c6db3e45bbdf53b';

async function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('PART3_RESULT_START');
  const R = {};
  
  try {
    console.log('1. Login');
    const loginRes = await apiCall('POST', '/auth/login', { username: 'uat_admin', password: 'uatpassword' });
    const token = loginRes.body && loginRes.body.access_token;
    if (!token) throw new Error('Login failed: ' + JSON.stringify(loginRes.body));

    console.log('2. Snapshot');
    const counts = {};
    const models = [
      'timberStock', 'timberStockMovement', 'timberStockReservation', 'rawLog', 'trimmedLog', 'inputLog',
      'sawnTimberOutput', 'sawnTimberOutputItem', 'timberPurchase', 'timberPurchaseLogItem', 'timberSalesOrder',
      'timberSalesOrderItem', 'timberShipment', 'timberShipmentItem', 'stockAdjustment', 'stockAdjustmentItem',
      'stockTransfer', 'stockTransferItem', 'productionProcess', 'productionProcessInput', 'productionProcessOutput',
      'timberStockOpname', 'timberStockOpnameItem'
    ];
    for (const m of models) counts[m] = await uat[m].count({ where: { company_id: UAT_COMPANY_ID } }).catch(() => 0);
    R.s1_counts = counts;

    console.log('3. Adjustments');
    const uatWH = await uat.warehouse.findFirst({ where: { code: 'WH-UAT-49H', company_id: UAT_COMPANY_ID } });
    const variant = await uat.timberVariant.findFirst({ where: { company_id: UAT_COMPANY_ID } });
    const stocks = await uat.timberStock.findMany({ where: { locationId: uatWH.id, timberVariantId: variant.id, currentPcs: { gt: 0 } } });
    const useBatch = stocks.length > 0 ? stocks[0].batch : 'UNKNOWN';
    let ts = Date.now();

    let adjPosPre = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
    let prePcs = adjPosPre ? adjPosPre.currentPcs : 0;
    const adjPosRes = await apiCall('POST', '/inventory/adjustments', {
      adjustmentNumber: 'ADJ-POS-' + ts, date: new Date().toISOString(), locationId: uatWH.id, notes: 'UAT Adj Pos',
      items: [{ timberVariantId: variant.id, differencePcs: 10, differenceM3: 0.02, batch: useBatch, systemPcs: prePcs }]
    }, token);
    const adjPosId = adjPosRes.body && adjPosRes.body.id;
    if (adjPosId) {
      await apiCall('POST', '/inventory/adjustments/' + adjPosId + '/post', {}, token);
      let adjPosMid = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
      await apiCall('POST', '/inventory/adjustments/' + adjPosId + '/cancel', {}, token);
      let adjPosPost = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
      
      const movs = await uat.timberStockMovement.findMany({ where: { referenceId: adjPosId } });
      R.s2_pos = { pre: prePcs, mid: adjPosMid ? adjPosMid.currentPcs : 0, post: adjPosPost ? adjPosPost.currentPcs : 0, movTypes: movs.map(m => m.type + '-' + m.referenceType) };
      prePcs = adjPosPost ? adjPosPost.currentPcs : 0;
    } else {
      R.s2_pos = { error: adjPosRes.body };
    }

    console.log('4. Negative Adjustment');
    const adjNegRes = await apiCall('POST', '/inventory/adjustments', {
      adjustmentNumber: 'ADJ-NEG-' + ts, date: new Date().toISOString(), locationId: uatWH.id, notes: 'UAT Adj Neg',
      items: [{ timberVariantId: variant.id, differencePcs: -5, differenceM3: -0.01, batch: useBatch, systemPcs: prePcs }]
    }, token);
    const adjNegId = adjNegRes.body && adjNegRes.body.id;
    if (adjNegId) {
      await apiCall('POST', '/inventory/adjustments/' + adjNegId + '/post', {}, token);
      let adjNegMid = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
      await apiCall('POST', '/inventory/adjustments/' + adjNegId + '/cancel', {}, token);
      let adjNegPost = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
      const nmovs = await uat.timberStockMovement.findMany({ where: { referenceId: adjNegId } });
      R.s3_neg = { pre: prePcs, mid: adjNegMid ? adjNegMid.currentPcs : 0, post: adjNegPost ? adjNegPost.currentPcs : 0, movTypes: nmovs.map(m => m.type + '-' + m.referenceType) };
      
      const dupCancel = await apiCall('POST', '/inventory/adjustments/' + adjNegId + '/cancel', {}, token);
      R.s4_idem = dupCancel.status;
    }

    console.log('5. Transfer');
    let loc2 = await uat.location.findFirst({ where: { code: 'LOC-UAT-2' } });
    if (!loc2) loc2 = await uat.location.create({ data: { company_id: UAT_COMPANY_ID, code: 'LOC-UAT-2', name: 'UAT Loc 2', warehouseId: uatWH.id, isActive: true } });
    
    const trfRes = await apiCall('POST', '/inventory/transfers', {
      transferNumber: 'TRF-' + ts, date: new Date().toISOString(), sourceLocationId: uatWH.id, destinationLocationId: loc2.id, notes: 'UAT Trf',
      items: [{ timberVariantId: variant.id, quantityPcs: 1, volumeM3: 0.002, batch: useBatch }]
    }, token);
    const trfId = trfRes.body && trfRes.body.id;
    if (trfId) {
      await apiCall('POST', '/inventory/transfers/' + trfId + '/post', {}, token);
      let trfMidSrc = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
      let trfMidDst = await uat.timberStock.findFirst({ where: { locationId: loc2.id, timberVariantId: variant.id, batch: useBatch } });
      await apiCall('POST', '/inventory/transfers/' + trfId + '/cancel', {}, token);
      let trfPostSrc = await uat.timberStock.findFirst({ where: { locationId: uatWH.id, timberVariantId: variant.id, batch: useBatch } });
      let trfPostDst = await uat.timberStock.findFirst({ where: { locationId: loc2.id, timberVariantId: variant.id, batch: useBatch } });
      
      R.s5_trf = { 
        srcMid: trfMidSrc ? trfMidSrc.currentPcs : 0, srcPost: trfPostSrc ? trfPostSrc.currentPcs : 0,
        dstMid: trfMidDst ? trfMidDst.currentPcs : 0, dstPost: trfPostDst ? trfPostDst.currentPcs : 0
      };

      const trfCancelIdem = await apiCall('POST', '/inventory/transfers/' + trfId + '/cancel', {}, token);
      R.s6_idem = trfCancelIdem.status;
    }

    console.log('6. Prod');
    const procRes = await apiCall('POST', '/inventory/production', {
      processNumber: 'PROD-' + ts, processType: 'GESEK', startDate: new Date().toISOString(), locationId: uatWH.id, status: 'DRAFT',
      inputs: [{ timberVariantId: variant.id, quantityPcs: 2, volumeM3: 0.004, batch: useBatch }],
      outputs: [{ timberVariantId: variant.id, quantityPcs: 2, volumeM3: 0.003, batch: useBatch + '-GESEK' }]
    }, token);
    const procId = procRes.body && procRes.body.id;
    let s7status = procRes.status;
    if (procId) {
      const pConf = await apiCall('PUT', '/inventory/production/' + procId + '/confirm', {}, token);
      s7status = pConf.status;
      if (s7status === 200 || s7status === 201) {
         await apiCall('PUT', '/inventory/production/' + procId + '/cancel', {}, token);
      }
    }
    R.s7_prod = s7status;

    console.log('7. Final verification');
    const so = await uat.timberSalesOrder.findFirst({ where: { company_id: UAT_COMPANY_ID }, include: { items: true }, orderBy: { createdAt: 'desc' } });
    if (so) {
      const ship = await uat.timberShipment.findFirst({ where: { salesOrderId: so.id }, include: { items: true }, orderBy: { createdAt: 'desc' } });
      const resv = await uat.timberStockReservation.findFirst({ where: { timberVariantId: variant.id, locationId: uatWH.id } });
      R.s89_recon = { 
        orderQty: so.items[0] ? so.items[0].orderQty : 0, realizedQty: so.items[0] ? so.items[0].realizedQty : 0, shipQty: ship && ship.items[0] ? ship.items[0].quantityPcs : 0,
        resvPcs: resv ? resv.reservedPcs : 0 
      };

      const vehicle = await uat.vehicle.findFirst({ where: { company_id: UAT_COMPANY_ID } });
      let driver = await uat.driver.findFirst({ where: { company_id: UAT_COMPANY_ID } });
      if (!driver) driver = await uat.driver.create({ data: { company_id: UAT_COMPANY_ID, name: 'UAT Driver' } });
      
      const shipReg = await apiCall('POST', '/inventory/timber-shipment', {
        shipmentNumber: 'SHIP-M3-' + ts, warehouseId: uatWH.id, vehicleId: vehicle.id, driverId: driver.id, customerId: so.customerId, salesOrderId: so.id,
        items: [{ timberVariantId: variant.id, batch: useBatch, quantityPcs: 1, volumeM3: 999.9, salesOrderItemId: so.items[0].id }]
      }, token);
      const shipRegId = shipReg.body && shipReg.body.id;
      if (shipRegId) {
        const s = await uat.timberShipment.findUnique({ where: { id: shipRegId }, include: { items: true } });
        R.s10_m3 = { storedM3: s.items[0].volumeM3, is999: s.items[0].volumeM3 === 999.9 };
        await apiCall('POST', '/inventory/timber-shipment/' + shipRegId + '/confirm', {}, token);
      } else {
        R.s10_m3 = { error: shipReg.body };
      }
    }

    const allStock = await uat.timberStock.findMany({ where: { company_id: UAT_COMPANY_ID } });
    let ledgerMatches = true;
    for (const s of allStock) {
      const m = await uat.timberStockMovement.aggregate({
        where: { company_id: UAT_COMPANY_ID, locationId: s.locationId, timberVariantId: s.timberVariantId, batch: s.batch },
        _sum: { quantityPcs: true }
      });
      if (s.currentPcs !== (m._sum.quantityPcs || 0)) ledgerMatches = false;
    }
    R.s14_ledger = ledgerMatches;
    R.s16_neg = (await uat.timberStock.findMany({ where: { company_id: UAT_COMPANY_ID, currentPcs: { lt: 0 } } })).length;

    const pcounts = {};
    for (const m of models) pcounts[m] = await prod[m].count().catch(() => 0);
    R.s20_prod = pcounts;

  } catch (err) {
    console.error('ERROR:', err);
    R.error = err.message;
  }
  
  console.log('RESULTS_JSON_START');
  console.log(JSON.stringify(R, null, 2));
  console.log('PART3_RESULT_END');
  process.exit(0);
}
run();
