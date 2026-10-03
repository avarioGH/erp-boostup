const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

schema = schema.replace(
  '  // RBAC Warehouse Access',
  '  created_disposals  InventoryDisposal[] @relation("DisposalCreator")\n  approved_disposals InventoryDisposal[] @relation("DisposalApprover")\n  // RBAC Warehouse Access'
);

schema = schema.replace(
  '  user_accesses UserWarehouseAccess[]',
  '  disposals      InventoryDisposal[]\n  user_accesses UserWarehouseAccess[]'
);

schema = schema.replace(
  '  purchase_request_items    PurchaseRequestItem[]',
  '  disposalItems             InventoryDisposalItem[]\n  purchase_request_items    PurchaseRequestItem[]'
);

fs.writeFileSync('backend/prisma/schema.prisma', schema);
