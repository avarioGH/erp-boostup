import os

file_path = "frontend/src/components/app-sidebar.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    c = f.read()

new_sales_module = """
  { 
    title: "Penjualan (Sales B2B)", 
    url: "/sales", 
    icon: ShoppingCart,
    id: "sales",
    subItems: [
      { title: "Penawaran (Quotation)", url: "/sales/quotations" },
      { title: "Sales Orders (SO)", url: "/sales/orders" },
      { title: "Pengiriman (Delivery)", url: "/sales/deliveries" }
    ]
  },
  { 
    title: "POS (Kasir Retail)", 
"""

c = c.replace('  { \n    title: "Penjualan & Kasir (POS)",', new_sales_module)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(c)

print("Sidebar updated with Sales B2B module.")
