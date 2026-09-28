const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/purchase/create/page.tsx', 'utf8');

const target = `        if (item.purchaseThickness && item.purchaseThickness <= 0) throw new Error("Supplier Thickness must be > 0");
        if (item.purchaseWidth && item.purchaseWidth <= 0) throw new Error("Supplier Width must be > 0");
        if (item.purchaseLength && item.purchaseLength <= 0) throw new Error("Supplier Length must be > 0");
        if (item.unitPrice && item.unitPrice < 0) throw new Error("Unit Price cannot be negative");`;

const replacement = `        if (item.purchaseThickness && Number(item.purchaseThickness) <= 0) throw new Error("Supplier Thickness must be > 0");
        if (item.purchaseWidth && Number(item.purchaseWidth) <= 0) throw new Error("Supplier Width must be > 0");
        if (item.purchaseLength && Number(item.purchaseLength) <= 0) throw new Error("Supplier Length must be > 0");
        if (item.unitPrice && Number(item.unitPrice) < 0) throw new Error("Unit Price cannot be negative");`;

content = content.replace(target, replacement);
fs.writeFileSync('frontend/src/app/inventory/purchase/create/page.tsx', content, 'utf8');
console.log('Fixed typescript comparison error');
