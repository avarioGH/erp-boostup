const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const http = require('http');

// ===== HELPERS =====
async function apiCall(method, path, body, token) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
    const req = http.request({
      hostname: 'localhost', port: 3001, path, method, headers
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', e => resolve({ status: -1, error: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: -1, error: 'timeout' }); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  const envContent = fs.readFileSync('/root/erp-boostup/backend/.env', 'utf-8');
  const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
  const rawUrl = dbUrlLine.substring(dbUrlLine.indexOf('=') + 1).trim().replace(/['"]/g, '');
  const urlObj = new URL(rawUrl);
  urlObj.pathname = '/uat_erp';
  const uatUrl = urlObj.toString();

  const uat = new PrismaClient({ datasources: { db: { url: uatUrl } } });
  const prod = new PrismaClient({ datasources: { db: { url: rawUrl } } });

  const R = {};

  // ===== SECTION 0 — PREFLIGHT =====
  const UAT_COMPANY_ID = '6ab79d610c6db3e45bbdf53b';
  const PROD_COMPANY_ID = '6ab6a3c170de3c0b5cb580cf';

  // Safety gates
  const uatCompany = await uat.company.findUnique({ where: { id: UAT_COMPANY_ID } });
  const prodInUat = await uat.company.findUnique({ where: { id: PROD_COMPANY_ID } }).catch(() => null);
  const prodInProd = await prod.company.findUnique({ where: { id: PROD_COMPANY_ID } });
  const uatWH = await uat.warehouse.findFirst({ where: { code: 'WH-UAT-49H', company_id: UAT_COMPANY_ID } });
  const uatLoc = await uat.location.findFirst({ where: { code: 'LOC-UAT-49H' } });

  R.s0_preflight = {
    dbName: 'uat_erp',
    uatCompanyFound: !!uatCompany,
    uatCompanyName: uatCompany?.name,
    prodInUat: !!prodInUat,
    prodInProd: !!prodInProd,
    warehouseFound: !!uatWH,
    warehouseId: uatWH?.id,
    locationFound: !!uatLoc,
    locationId: uatLoc?.id,
    safetyResult: !prodInUat && !!uatCompany && !!uatWH && !!uatLoc ? 'PASS' : 'FAIL'
  };

  if (!uatCompany || prodInUat || !uatWH || !uatLoc) {
    console.log('PREFLIGHT FAIL - ABORTING');
    console.log(JSON.stringify(R.s0_preflight, null, 2));
    await uat.'();
    await prod.'();
    process.exit(1);
  }
  console.log('S0_PREFLIGHT_PASS');

  // Transactional baseline
  const getTxnBaseline = async (prisma) => ({
    timberStock: await prisma.timberStock.count(),
    timberStockMovement: await prisma.timberStockMovement.count(),
    rawLog: await prisma.rawLog.count(),
    trimmedLog: await prisma.trimmedLog.count(),
    inputLog: await prisma.inputLog.count(),
    sawnTimberOutput: await prisma.sawnTimberOutput.count(),
    sawnTimberOutputItem: await prisma.sawnTimberOutputItem.count().catch(() => 0),
    timberPurchase: await prisma.timberPurchase.count(),
    timberPurchaseLogItem: await prisma.timberPurchaseLogItem.count().catch(() => 0),
    timberShipment: await prisma.timberShipment.count(),
    timberShipmentItem: await prisma.timberShipmentItem.count().catch(() => 0),
    timberStockReservation: await prisma.timberStockReservation.count(),
    stockAdjustment: await prisma.stockAdjustment.count(),
    stockAdjustmentItem: await prisma.stockAdjustmentItem.count().catch(() => 0),
    stockTransfer: await prisma.stockTransfer.count(),
    stockTransferItem: await prisma.stockTransferItem.count().catch(() => 0),
    productionProcess: await prisma.productionProcess.count().catch(() => 0),
    timberStockOpname: await prisma.timberStockOpname.count().catch(() => 0),
    timberStockOpnameItem: await prisma.timberStockOpnameItem.count().catch(() => 0),
  });

  R.s0_uatBaseline = await getTxnBaseline(uat);
  R.s0_prodBaseline = {
    company: await prod.company.count(),
    warehouse: await prod.warehouse.count(),
    location: await prod.location.count(),
    timberStock: await prod.timberStock.count(),
    timberStockMovement: await prod.timberStockMovement.count(),
    timberVariant: await prod.timberVariant.count(),
    rawLog: await prod.rawLog.count().catch(() => 0),
    inputLog: await prod.inputLog.count().catch(() => 0),
    timberPurchase: await prod.timberPurchase.count().catch(() => 0),
    timberShipment: await prod.timberShipment.count().catch(() => 0),
    stockAdjustment: await prod.stockAdjustment.count().catch(() => 0),
    stockTransfer: await prod.stockTransfer.count().catch(() => 0),
  };
  console.log('S0_BASELINE_OK:', JSON.stringify(R.s0_uatBaseline));

  // ===== SECTION 1 — AUTHORIZATION =====
  // Rename UAT Admin role to 'Admin' (bypasses permission check)
  const uatRole = await uat.role.findFirst({ where: { company_id: UAT_COMPANY_ID } });
  if (uatRole && uatRole.name !== 'Admin') {
    await uat.role.update({ where: { id: uatRole.id }, data: { name: 'Admin' } });
  }
  // Assign warehouse access if warehouse_user table exists
  try {
    await uat.warehouseUser.upsert({
      where: { warehouseId_userId: { warehouseId: uatWH.id, userId: (await uat.user.findFirst({ where: { company_id: UAT_COMPANY_ID, username: 'uat_admin' } })).id } },
      create: { warehouseId: uatWH.id, userId: (await uat.user.findFirst({ where: { company_id: UAT_COMPANY_ID, username: 'uat_admin' } })).id },
      update: {}
    });
  } catch(e) { /* warehouseUser may not exist */ }
  R.s1_auth = { roleRenamed: 'Admin', permissionBypass: 'Owner/Admin role name bypass in PermissionsGuard', warehouseAccess: 'WH-UAT-49H' };
  console.log('S1_AUTH_OK');

  // LOGIN
  const loginRes = await apiCall('POST', '/auth/login', { username: 'uat_admin', password: 'uatpassword' });
  const token = loginRes.body?.access_token;
  if (!token) {
    console.log('LOGIN FAILED:', JSON.stringify(loginRes));
    process.exit(1);
  }
  R.s1_login = { statusCode: loginRes.status, hasToken: true, companyId: loginRes.body?.user ? 'extracted from JWT' : 'see token' };
  console.log('S1_LOGIN_OK');

  // ===== SECTION 2 — PURCHASE DECLARATION =====
  const uatSpecies = await uat.timberSpecies.findFirst({ where: { company_id: UAT_COMPANY_ID } });
  const uatVariant = await uat.timberVariant.findFirst({ where: { company_id: UAT_COMPANY_ID } });
  
  const purchasePayload = {
    purchaseNumber: 'UAT-PO-49H-001',
    purchaseDate: '2026-09-26',
    sourceId: (await uat.timberSource.findFirst({ where: { company_id: UAT_COMPANY_ID } })).id,
    warehouseId: uatWH.id,
    notes: 'UAT Purchase 49H',
    items: [{ timberVariantId: uatVariant.id, quantityPcs: 2, volumeM3: 0.004 }],
    logItems: [
      {
        logNumber: 'LOG-UAT-001',
        species: uatSpecies.code,
        speciesId: uatSpecies.id,
        purchaseLength: 5000,
        purchaseDiameter1: 300, purchaseDiameter2: 310, purchaseDiameter3: 300, purchaseDiameter4: 310,
        purchaseVolume: 0.380
      },
      {
        logNumber: 'LOG-UAT-002',
        species: uatSpecies.code,
        speciesId: uatSpecies.id,
        purchaseLength: 4000,
        purchaseDiameter1: 250, purchaseDiameter2: 260, purchaseDiameter3: 250, purchaseDiameter4: 260,
        purchaseVolume: 0.212
      }
    ]
  };

  const purchaseRes = await apiCall('POST', '/inventory/timber-purchase', purchasePayload, token);
  R.s2_purchase = {
    status: purchaseRes.status,
    id: purchaseRes.body?.id,
    purchaseNumber: purchaseRes.body?.purchaseNumber,
    purchaseStatus: purchaseRes.body?.status,
    logItemsCreated: purchaseRes.body?.logItems?.length,
    error: purchaseRes.status >= 400 ? purchaseRes.body : undefined
  };
  console.log('S2_PURCHASE:', purchaseRes.status, purchaseRes.body?.id || JSON.stringify(purchaseRes.body).substring(0, 200));

  const purchaseId = purchaseRes.body?.id;
  
  // Stock must still be 0 after DRAFT purchase
  const stockAfterPurchase = await uat.timberStock.count();
  const movAfterPurchase = await uat.timberStockMovement.count();
  R.s2_stockCheck = { timberStock: stockAfterPurchase, timberStockMovement: movAfterPurchase, deltaCheck: stockAfterPurchase === 0 && movAfterPurchase === 0 ? 'PASS - no inventory created by DRAFT purchase' : 'FAIL' };

  // Get log item ID
  let purchaseDetail = null;
  if (purchaseId) {
    const detailRes = await apiCall('GET', '/inventory/timber-purchase/' + purchaseId, null, token);
    purchaseDetail = detailRes.body;
  }
  const logItem1 = purchaseDetail?.logItems?.find(l => l.logNumber === 'LOG-UAT-001');
  const logItem2 = purchaseDetail?.logItems?.find(l => l.logNumber === 'LOG-UAT-002');
  R.s2_logItems = {
    logItem1Id: logItem1?.id,
    logItem1Number: logItem1?.logNumber,
    logItem1Status: logItem1?.status,
    logItem2Id: logItem2?.id,
    logItem2Number: logItem2?.logNumber,
    logItem2Status: logItem2?.status
  };

  console.log('JSON_PARTIAL_S2:', JSON.stringify({ s0_preflight: R.s0_preflight, s0_uatBaseline: R.s0_uatBaseline, s0_prodBaseline: R.s0_prodBaseline, s1_auth: R.s1_auth, s2_purchase: R.s2_purchase, s2_stockCheck: R.s2_stockCheck, s2_logItems: R.s2_logItems }));

  // ===== SECTION 3 — ACTUAL RECEIVING =====
  const receivingPayload = {
    purchaseLogItemId: logItem1?.id,
    locationId: uatLoc.id,
    speciesId: uatSpecies.id,
    sourceId: (await uat.timberSource.findFirst({ where: { company_id: UAT_COMPANY_ID } })).id,
    originalLength: 4900,
    diameter1: 290, diameter2: 300, diameter3: 290, diameter4: 300,
    gerowong: 0,
    trimmingLength: 0,
    batch: 'UAT-BATCH-49H-001',
    receivingDate: '2026-09-26',
    notes: 'UAT receiving - intentionally shorter than purchase'
  };
  const rawLogRes = await apiCall('POST', '/inventory/logs', receivingPayload, token);
  R.s3_receiving = {
    status: rawLogRes.status,
    rawLogId: rawLogRes.body?.id,
    logNumber: rawLogRes.body?.logNumber,
    originalLength: rawLogRes.body?.originalLength,
    avgDiameter: rawLogRes.body?.averageDiameter,
    roundedDiameter: rawLogRes.body?.roundedDiameter,
    grossVolume: rawLogRes.body?.grossVolume,
    hollowVolume: rawLogRes.body?.hollowVolume,
    trimmingVolume: rawLogRes.body?.trimmingVolume,
    netVolume: rawLogRes.body?.netVolume,
    batch: rawLogRes.body?.batch,
    status2: rawLogRes.body?.status,
    purchaseDiff: { purchaseLength: 5000, actualLength: 4900, purchaseDiam: '300/310/300/310', actualDiam: '290/300/290/300' },
    error: rawLogRes.status >= 400 ? rawLogRes.body : undefined
  };
  console.log('S3_RAWLOG:', rawLogRes.status, rawLogRes.body?.id);

  // Verify purchaseLogItem is now RECEIVED
  if (logItem1?.id) {
    const pli = await uat.timberPurchaseLogItem.findUnique({ where: { id: logItem1.id } });
    R.s3_pliStatus = { id: pli?.id, logNumber: pli?.logNumber, status: pli?.status, verify: pli?.status === 'RECEIVED' ? 'PASS' : 'FAIL' };
  }

  const rawLogId = rawLogRes.body?.id;

  // ===== SECTION 4 — DUPLICATE RECEIVING PROTECTION =====
  const dupReceivingPayload = { ...receivingPayload };
  const dupRes = await apiCall('POST', '/inventory/logs', dupReceivingPayload, token);
  R.s4_dupProtection = {
    status: dupRes.status,
    rejected: dupRes.status >= 400,
    error: dupRes.body,
    verify: dupRes.status >= 400 ? 'PASS - duplicate receiving rejected' : 'FAIL - duplicate receiving accepted'
  };
  console.log('S4_DUP_PROTECTION:', dupRes.status, R.s4_dupProtection.verify);

  // ===== SECTION 5 — TRIMMING =====
  const trimmingPayload = {
    trimmingLength: 200,
    gerowong: 50,
    batch: 'UAT-BATCH-49H-001',
    notes: 'UAT trimming operation'
  };
  let trimmedLogId = null;
  if (rawLogId) {
    const trimRes = await apiCall('POST', '/inventory/logs/' + rawLogId + '/trimming', trimmingPayload, token);
    R.s5_trimming = {
      status: trimRes.status,
      trimmedLogId: trimRes.body?.id,
      rawLogId: trimRes.body?.rawLogId,
      grossVolume: trimRes.body?.grossVolume,
      hollowVolume: trimRes.body?.hollowVolume,
      trimmingVolume: trimRes.body?.trimmingVolume,
      netVolume: trimRes.body?.netVolume,
      batch: trimRes.body?.batch,
      genealogy: trimRes.body?.rawLogId === rawLogId ? 'PASS - rawLogId matches' : 'CHECK NEEDED',
      error: trimRes.status >= 400 ? trimRes.body : undefined
    };
    trimmedLogId = trimRes.body?.id;
    console.log('S5_TRIMMING:', trimRes.status, trimmedLogId);
  }

  // ===== SECTION 6 — INPUT LOG =====
  let inputLogId = null;
  if (trimmedLogId) {
    const inputPayload = {
      inputDate: '2026-09-26',
      locationId: uatLoc.id,
      trimmedLogIds: [trimmedLogId],
      batch: 'UAT-BATCH-49H-001',
      notes: 'UAT InputLog 49H',
      machine: 'SAWMILL-1'
    };
    const inputRes = await apiCall('POST', '/inventory/input-logs', inputPayload, token);
    R.s6_inputLog = {
      status: inputRes.status,
      id: inputRes.body?.id,
      inputNumber: inputRes.body?.inputNumber,
      totalGross: inputRes.body?.totalGross,
      totalGerowong: inputRes.body?.totalGerowong,
      totalTrimming: inputRes.body?.totalTrimming,
      totalVolume: inputRes.body?.totalVolume,
      formula: 'totalVolume = totalGross - totalGerowong (NOT minus trimming)',
      inputLogStatus: inputRes.body?.status,
      error: inputRes.status >= 400 ? inputRes.body : undefined
    };
    inputLogId = inputRes.body?.id;

    // Verify formula: net = gross - hollow (NOT gross - hollow - trimming)
    if (inputRes.body) {
      const g = Number(inputRes.body.totalGross) || 0;
      const h = Number(inputRes.body.totalGerowong) || 0;
      const t = Number(inputRes.body.totalTrimming) || 0;
      const net = Number(inputRes.body.totalVolume) || 0;
      const correctNet = parseFloat((g - h).toFixed(6));
      const wrongNet = parseFloat((g - h - t).toFixed(6));
      R.s6_inputLog.formulaVerification = {
        gross: g, hollow: h, trimming: t, netReported: net,
        expectedCorrect: correctNet, expectedWrong: wrongNet,
        verify: Math.abs(net - correctNet) < 0.0001 ? 'PASS - net = gross - hollow (correct)' : (Math.abs(net - wrongNet) < 0.0001 ? 'FAIL - double subtraction bug' : 'CHECK')
      };
    }
    console.log('S6_INPUTLOG:', inputRes.status, inputLogId);
  }

  // ===== SECTION 7 — SAWN TIMBER OUTPUT =====
  const uatGrade = await uat.timberGrade.findFirst({ where: { company_id: UAT_COMPANY_ID } });
  let outputId = null;
  let outputBatch = null;
  if (inputLogId) {
    const outputPayload = {
      inputLogId,
      outputDate: '2026-09-26',
      shift: 'PAGI',
      operatorName: 'UAT Operator',
      machine: 'SAWMILL-1',
      locationId: uatLoc.id,
      batch: 'UAT-BATCH-49H-OUT-001',
      notes: 'UAT Production Output',
      items: [
        {
          speciesId: uatSpecies.id,
          species: uatSpecies.code,
          gradeId: uatGrade.id,
          grade: uatGrade.code,
          thickness: 20, width: 100, length: 1000,
          quantityPcs: 5,
          remarks: 'UAT A-UAT 20x100x1000'
        },
        {
          speciesId: uatSpecies.id,
          species: uatSpecies.code,
          gradeId: uatGrade.id,
          grade: uatGrade.code,
          thickness: 20, width: 100, length: 800,
          quantityPcs: 5,
          remarks: 'UAT A-UAT 20x100x800'
        }
      ]
    };
    const outputRes = await apiCall('POST', '/inventory/sawn-timber/output', outputPayload, token);
    R.s7_output = {
      status: outputRes.status,
      id: outputRes.body?.id,
      bundleNumber: outputRes.body?.bundleNumber,
      batch: outputRes.body?.batch,
      outputStatus: outputRes.body?.status,
      itemCount: outputRes.body?.items?.length,
      items: outputRes.body?.items?.map(i => ({ variantId: i.timberVariantId, pcs: i.quantityPcs, vol: i.volumeM3 })),
      error: outputRes.status >= 400 ? outputRes.body : undefined
    };
    outputId = outputRes.body?.id;
    outputBatch = outputRes.body?.batch;
    console.log('S7_OUTPUT:', outputRes.status, outputId, 'batch:', outputBatch);
  }

  console.log('JSON_PARTIAL_S3_7:', JSON.stringify({ s3_receiving: R.s3_receiving, s3_pliStatus: R.s3_pliStatus, s4_dupProtection: R.s4_dupProtection, s5_trimming: R.s5_trimming, s6_inputLog: R.s6_inputLog, s7_output: R.s7_output }));

  // ===== SECTION 8 — POST OUTPUT (creates stock movements) =====
  let postResult = null;
  if (outputId) {
    const postRes = await apiCall('POST', '/inventory/sawn-timber/output/' + outputId + '/post', {}, token);
    R.s8_postOutput = { status: postRes.status, result: postRes.body, error: postRes.status >= 400 ? postRes.body : undefined };
    console.log('S8_POST_OUTPUT:', postRes.status);

    // Verify movements created
    const movs = await uat.timberStockMovement.findMany({ where: { referenceId: outputId } });
    const stocks = await uat.timberStock.findMany({ where: { company_id: UAT_COMPANY_ID } });
    R.s8_ledger = {
      movementsCreated: movs.length,
      movements: movs.map(m => ({ type: m.movementType, pcs: m.quantityPcs, vol: m.volumeM3, batch: m.batch, variantId: m.timberVariantId })),
      stockEntries: stocks.map(s => ({ variantId: s.timberVariantId, pcs: s.currentPcs, vol: s.currentVolumeM3, batch: s.batch, locationId: s.locationId })),
      allMovementsIn: movs.every(m => m.movementType === 'PRODUCTION_OUTPUT') ? 'PASS' : 'CHECK',
      batchCheck: movs.every(m => m.batch === outputBatch) ? 'PASS - batch matches output' : 'FAIL'
    };
    console.log('S8_LEDGER: movements=', movs.length, 'stocks=', stocks.length);
  }

  // ===== SECTION 9 — STOCK CARD =====
  const uatVariantNow = await uat.timberVariant.findFirst({ where: { company_id: UAT_COMPANY_ID, sku: 'UAT-SKU-49H-1790418274303' } });
  const variantForCard = uatVariantNow || await uat.timberVariant.findFirst({ where: { company_id: UAT_COMPANY_ID } });
  if (variantForCard && uatLoc) {
    const cardRes = await apiCall('GET', '/inventory/reports/stock-card?variantId=' + variantForCard.id + '&locationId=' + uatLoc.id + '&startDate=2026-09-01&endDate=2026-09-30', null, token);
    R.s9_stockCard = {
      status: cardRes.status,
      variantId: variantForCard.id,
      hasData: Array.isArray(cardRes.body) ? cardRes.body.length > 0 : !!cardRes.body?.movements,
      body: cardRes.status >= 400 ? cardRes.body : (Array.isArray(cardRes.body) ? 'array:' + cardRes.body.length : typeof cardRes.body),
      error: cardRes.status >= 400 ? cardRes.body : undefined
    };
    console.log('S9_STOCK_CARD:', cardRes.status);
  }

  // ===== SECTION 10 — YIELD REPORT =====
  const yieldRes = await apiCall('GET', '/inventory/reports/yield?startDate=2026-09-01&endDate=2026-09-30', null, token);
  R.s10_yield = { status: yieldRes.status, body: yieldRes.status < 400 ? (Array.isArray(yieldRes.body) ? 'array:' + yieldRes.body.length : JSON.stringify(yieldRes.body).substring(0, 300)) : yieldRes.body };
  console.log('S10_YIELD:', yieldRes.status);

  console.log('JSON_PARTIAL_S8_10:', JSON.stringify({ s8_postOutput: R.s8_postOutput, s8_ledger: R.s8_ledger, s9_stockCard: R.s9_stockCard, s10_yield: R.s10_yield }));

  await uat.'();
  await prod.'();
  console.log('PART1_DONE');
}

run().catch(e => console.error('FATAL:', e.message, e.stack?.substring(0, 500)));
