const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/[id]/page.tsx", "utf8");

content = content.replace(/Back to Customers/g, "Kembali ke Daftar Pelanggan");
content = content.replace(/No address provided/g, "Tidak ada alamat");
content = content.replace(/Total Invoiced \\(LTV\\)/g, "Total Tagihan (LTV)");
content = content.replace(/Total Orders/g, "Total Pesanan");
content = content.replace(/Outstanding AR/g, "Total Piutang");
content = content.replace(/Active Opportunities/g, "Peluang Aktif");
content = content.replace(/Overview & Timeline/g, "Ringkasan & Riwayat");
content = content.replace(/Sales & Quotations/g, "Penjualan & Penawaran");
content = content.replace(/Deliveries/g, "Pengiriman");
content = content.replace(/Finance/g, "Keuangan");
content = content.replace(/Invoices/g, "Faktur Tagihan");
content = content.replace(/No invoices found\./g, "Tidak ada faktur tagihan.");
content = content.replace(/Payments Received/g, "Riwayat Pembayaran Masuk");
content = content.replace(/No payments found\./g, "Tidak ada riwayat pembayaran.");
content = content.replace(/New Quotation/g, "Buat Penawaran");
content = content.replace(/Log Activity/g, "Catat Aktivitas");
content = content.replace(/Manage/g, "Kelola");
content = content.replace(/Invoice #/g, "Nomor Faktur");
content = content.replace(/Date/g, "Tanggal");
content = content.replace(/Status/g, "Status");
content = content.replace(/Total/g, "Total");
content = content.replace(/Remaining/g, "Sisa Tagihan");
content = content.replace(/Payment #/g, "Nomor Pembayaran");
content = content.replace(/Method/g, "Metode");
content = content.replace(/Amount/g, "Jumlah");

content = content.replace("<Button variant=\"outline\" size=\"sm\"><FileText className=\"w-4 h-4 mr-2\" /> Buat Penawaran</Button>", 
"<Button variant=\"outline\" size=\"sm\" onClick={() => alert(\"Fitur Penawaran Segera Hadir\")}><FileText className=\"w-4 h-4 mr-2\" /> Buat Penawaran</Button>");

content = content.replace("<Button size=\"sm\" className=\"bg-indigo-600 hover:bg-indigo-700\"><Activity className=\"w-4 h-4 mr-2\" /> Catat Aktivitas</Button>", 
"<Button size=\"sm\" className=\"bg-indigo-600 hover:bg-indigo-700\" onClick={() => router.push(\"/crm/activities\")}><Activity className=\"w-4 h-4 mr-2\" /> Catat Aktivitas</Button>");

fs.writeFileSync("frontend/src/app/crm/customers/[id]/page.tsx", content);

