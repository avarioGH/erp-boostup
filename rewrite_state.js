const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/purchase/create/page.tsx', 'utf8');

// Update default state
content = content.replace(
  `items: [{ timberVariantId: "", quantityPcs: 1, volumeM3: 0, batch: "", notes: "" }]`,
  `items: [{ timberVariantId: "", quantityPcs: 1, volumeM3: 0, batch: "", notes: "", purchaseThickness: "", purchaseWidth: "", purchaseLength: "", unitPrice: "" }]`
);

// Update Add Item button
content = content.replace(
  `onClick={() => setForm({ ...form, items: [...form.items, { timberVariantId: "", quantityPcs: 1, volumeM3: 0, batch: "", notes: "" }] })}>`,
  `onClick={() => setForm({ ...form, items: [...form.items, { timberVariantId: "", quantityPcs: 1, volumeM3: 0, batch: "", notes: "", purchaseThickness: "", purchaseWidth: "", purchaseLength: "", unitPrice: "" }] })}>`
);

// Add Validation
const validationSearch = `        if (!item.batch || item.batch.trim() === "") throw new Error("Partai (Batch) is required for all items");`;
const validationReplace = `        if (!item.batch || item.batch.trim() === "") throw new Error("Partai (Batch) is required for all items");
        if (item.purchaseThickness && item.purchaseThickness <= 0) throw new Error("Supplier Thickness must be > 0");
        if (item.purchaseWidth && item.purchaseWidth <= 0) throw new Error("Supplier Width must be > 0");
        if (item.purchaseLength && item.purchaseLength <= 0) throw new Error("Supplier Length must be > 0");
        if (item.unitPrice && item.unitPrice < 0) throw new Error("Unit Price cannot be negative");`;

content = content.replace(validationSearch, validationReplace);

fs.writeFileSync('frontend/src/app/inventory/purchase/create/page.tsx', content, 'utf8');
console.log('Successfully updated validation and default states.');
