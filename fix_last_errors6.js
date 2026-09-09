const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code = code.replace(/product_id\s+String\s+@db\.ObjectId\n\s+manufacturing_order_id\s+String\?\s+@db\.ObjectId/, 'product_id String @db.ObjectId\n  product Product @relation(fields: [product_id], references: [id])\n  manufacturing_order_id String? @db.ObjectId\n  manufacturing_order ManufacturingOrder? @relation(fields: [manufacturing_order_id], references: [id])');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
