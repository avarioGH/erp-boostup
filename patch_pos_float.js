const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

content = content.replace(/<span className="text-sm font-bold w-4 text-center">{item.qty}<\/span>/g, `<input type="number" step="any" min="0" value={item.qty} onChange={(e) => {
  const v = e.target.value === "" ? 0 : parseFloat(e.target.value);
  setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: v } : i));
}} className="w-16 text-center text-sm font-bold bg-transparent outline-none" />`);

// Update updateQty delta to 1 (which it is, +1 or -1). For floats, this still works for unit increment.
// But we might want them to type directly.
fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

