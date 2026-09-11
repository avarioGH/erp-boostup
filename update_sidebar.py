import os
import re

file_path = "frontend/src/components/app-sidebar.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    c = f.read()

# I will replace the entire items array.
# The original items array starts at `const items: MenuItem[] = [` and ends at `\n]\n\nconst settings:`

new_items = """const items: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  {
    title: "Pembelian (Purchasing)",
    url: "/purchasing",
    icon: ShoppingCart,
    id: "purchasing",
    subItems: [
      { title: "Analytics", url: "/purchasing/analytics" },
      { title: "Permintaan (RFQ)", url: "/purchasing/rfqs" },
      { title: "Purchase Orders (PO)", url: "/purchasing/orders" },
      { title: "Penerimaan Barang", url: "/purchasing/receipts" },
      { title: "Pembayaran Tagihan (AP)", url: "/finance/ap-payments" }
    ]
  },
  { 
    title: "Inventaris", 
    url: "/inventory", 
    icon: Box,
    id: "inventory",
    subItems: [
      { title: "Produk", url: "/inventory/products" },
      { title: "Stok Masuk", url: "/inventory/stock-in" },
      { title: "Stok Keluar", url: "/inventory/stock-out" },
      { title: "Transfer Gudang", url: "/inventory/stock-transfer" },
      { title: "Penyesuaian Stok", url: "/inventory/stock-adjustment" },
      { title: "Laporan Stok", url: "/inventory/reports" }
    ]
  },
  { 
    title: "Penjualan & Kasir (POS)", 
    url: "/pos", 
    icon: ShoppingCart,
    id: "pos",
    subItems: [
      { title: "Kasir POS", url: "/pos/new-transaction" },
      { title: "Riwayat Penjualan", url: "/pos/order-history" },
      { title: "Shift & Kas", url: "/pos/shift" }
    ]
  },
  { 
    title: "Pelanggan & CRM", 
    url: "/crm", 
    icon: Users,
    id: "crm",
    subItems: [
      { title: "Daftar Pelanggan", url: "/crm/customers" },
      { title: "Pipeline & Leads", url: "/crm/pipeline" },
      { title: "Loyalty & Poin", url: "/customers/loyalty" },
      { title: "Voucher", url: "/customers/voucher" }
    ]
  },
  {
    title: "Keuangan & Akuntansi", 
    url: "/finance", 
    icon: Calculator,
    id: "finance",
    subItems: [
      { title: "Dashboard Keuangan", url: "/finance" },
      { title: "Kas & Bank", url: "/finance/cash" },
      { title: "Pemasukan", url: "/finance/cash-in" },
      { title: "Pengeluaran", url: "/finance/cash-out" },
      { title: "Buku Besar (GL)", url: "/finance/gl" },
      { title: "Periode Akuntansi", url: "/finance/accounting-periods" },
      { title: "Laporan Keuangan", url: "/finance/reports" }
    ]
  },
  {
    title: "HR & Absensi",
    url: "/hr",
    icon: UserCheck,
    id: "hr",
    subItems: [
      { title: "Dashboard HR", url: "/hr" },
      { title: "Pegawai", url: "/hr/employees" },
      { title: "Absensi", url: "/hr/attendance" },
      { title: "Penggajian (Payroll)", url: "/hr/payroll" },
      { title: "Shift", url: "/hr/shift" }
    ]
  },
  { 
    title: "AI Assistant", 
    url: "/ai", 
    icon: Bot,
    badge: "Beta",
    subItems: [
      { title: "Chat AI", url: "/ai/chat" },
      { title: "Analisis Inventaris", url: "/ai/inventory-analysis" },
      { title: "Analisis Keuangan", url: "/ai/finance-analysis" },
      { title: "Prediksi", url: "/ai/prediction" }
    ]
  },
]"""

c = re.sub(r'const items: MenuItem\[\] = \[\s*\{.*?\}\s*\n\]', new_items, c, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(c)

print("Updated sidebar items.")
