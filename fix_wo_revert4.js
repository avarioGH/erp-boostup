const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code = code.replace(/assigned_work_orders\s+ManufacturingWorkOrder\[\]/g, 'assigned_work_orders WorkOrder[]');
code = code.replace(/created_work_orders\s+ManufacturingWorkOrder\[\]/g, 'created_work_orders WorkOrder[]');
code = code.replace(/work_orders\s+ManufacturingWorkOrder\[\]\n/g, 'work_orders WorkOrder[]\n');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
