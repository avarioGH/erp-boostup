const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

function undoChange(modelName, badStr, goodStr) {
  const marker = "model " + modelName + " {";
  const lines = code.split('\n');
  let inModel = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker) {
      inModel = true;
    }
    if (inModel && lines[i].includes(badStr)) {
      lines[i] = lines[i].replace(badStr, goodStr);
    }
    if (inModel && lines[i].trim() === '}') {
      break;
    }
  }
  code = lines.join('\n');
}

undoChange('User', 'assigned_work_orders ManufacturingWorkOrder[]', 'assigned_work_orders WorkOrder[]');
undoChange('User', 'created_work_orders ManufacturingWorkOrder[]', 'created_work_orders WorkOrder[]');
undoChange('AssetMaster', 'work_orders ManufacturingWorkOrder[]', 'work_orders WorkOrder[]');

// AssetMaster is missing work_orders ManufacturingWorkOrder[]? No, AssetMaster has work_orders WorkOrder[] (for Maintenance).
// But wait! Earlier, scheduling.service.ts accessed sset on WorkOrderWhereInput! Wait. The query was using WorkOrder model because my scheduling service imported PrismaService.workOrder? But the TS error was:
// Property 'asset' does not exist on type '{ ... }' which was the ManufacturingWorkOrder.
// So scheduling service IS querying Prisma.workOrder (which maps to WorkOrder, which is Maintenance) or Prisma.manufacturingWorkOrder?
// Let me just fix the schema first.

// Also, the error said sset in WorkOrder is missing opposite in AssetMaster. Wait! If I just undid the change, AssetMaster now has work_orders WorkOrder[].
// The other errors say: sset in WorkOrder missing opposite in AssetMaster because maybe AssetMaster doesn't have it? Let's add it just in case it was missing.

// Wait, I replaced model AssetMaintenance with model WorkOrder earlier?
// Maintenance uses AssetMaintenance?
// Let's check if there's a model AssetMaintenance.
