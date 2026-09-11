  // === INVENTORY SETUP ===
  const inv = app.get(require('../src/inventory/inventory.service').InventoryService);
  const qService = app.get(require('../src/crm/quotation/quotation.service').QuotationService);
  const dService = app.get(require('../src/crm/delivery/delivery.service').DeliveryService);
  const soModel = prisma.salesOrder;
  const pService = app.get(require('../src/pos/pos.service').PosService);
  const invId1 = new ObjectId().toHexString();
  const prodId1 = new ObjectId().toHexString();
  const whId1 = new ObjectId().toHexString();
  const whId2 = new ObjectId().toHexString();
  const cusId1 = new ObjectId().toHexString();
  const catId1 = new ObjectId().toHexString();

  await prisma.category.create({ data: { id: catId1, company_id: c1, code: 'CAT-1', name: 'Cat 1' } });
  await prisma.product.create({ data: { id: prodId1, company_id: c1, code: 'P-1', name: 'Product 1', category_id: catId1, sku: 'SKU1', type: 'Stock', base_price: 100 } });
  await prisma.warehouse.create({ data: { id: whId1, company_id: c1, code: 'WH-1', name: 'Warehouse 1' } });
  await prisma.warehouse.create({ data: { id: whId2, company_id: c1, code: 'WH-2', name: 'Warehouse 2' } });
  await prisma.customer.create({ data: { id: cusId1, company_id: c1, code: 'CUS-1', name: 'Customer 1', email: 'c1@c.com' } });

  // Add 20F.2C Tests Here...
