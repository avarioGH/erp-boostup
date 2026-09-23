const fs = require('fs');
let content = fs.readFileSync('backend/src/inventory/inventory-ledger.service.ts', 'utf-8');

const oldRef = "export type ReferenceType = 'OPENING_BALANCE' | 'PRODUCTION_OUTPUT' | 'PRODUCTION_PROCESS_INPUT' | 'PRODUCTION_PROCESS_OUTPUT' | 'PRODUCTION_PROCESS_REVERSAL' | 'TIMBER_PURCHASE' | 'TIMBER_PURCHASE_REVERSAL' | 'TIMBER_SHIPMENT' | 'TIMBER_SHIPMENT_REVERSAL' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'REVERSAL' | 'SALES_DELIVERY';";
const newRef = "export type ReferenceType = 'OPENING_BALANCE' | 'PRODUCTION_OUTPUT' | 'PRODUCTION_PROCESS_INPUT' | 'PRODUCTION_PROCESS_OUTPUT' | 'PRODUCTION_PROCESS_REVERSAL' | 'TIMBER_PURCHASE' | 'TIMBER_PURCHASE_REVERSAL' | 'TIMBER_SHIPMENT' | 'TIMBER_SHIPMENT_REVERSAL' | 'STOCK_OPNAME_ADJUSTMENT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'REVERSAL' | 'SALES_DELIVERY';";

content = content.replace(oldRef, newRef);
fs.writeFileSync('backend/src/inventory/inventory-ledger.service.ts', content);
console.log('Updated ReferenceType enum');
