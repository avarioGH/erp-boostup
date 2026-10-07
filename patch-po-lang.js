const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

// 1. Badge Updates
code = code.replace(
  `const getReceiptBadge = (status: string) => {
  switch(status) {
    case 'PENDING': return <Badge variant="outline" className="text-amber-600 border-amber-200">Pending Receipt</Badge>
    case 'PARTIAL': return <Badge variant="outline" className="text-blue-600 border-blue-200">Partially Received</Badge>
    case 'RECEIVED': return <Badge className="">Fully Received</Badge>
    default: return null
  }
}`,
  `const getReceiptBadge = (status: string) => {
  switch(status) {
    case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Menunggu Barang</Badge>
    case 'PARTIAL': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">Diterima Sebagian</Badge>
    case 'RECEIVED': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Diterima Penuh</Badge>
    default: return null
  }
}`
);

code = code.replace(
  `const getBillBadge = (status: string) => {
  switch(status) {
    case 'PENDING': return <Badge variant="outline" className="text-amber-600 border-amber-200">Unbilled</Badge>
    case 'BILLED': return <Badge className="">Billed</Badge>
    default: return null
  }
}`,
  `const getBillBadge = (status: string) => {
  switch(status) {
    case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Belum Ditagih</Badge>
    case 'BILLED': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Sudah Ditagih</Badge>
    default: return null
  }
}

const getPaymentBadge = (status: string) => {
  switch(status) {
    case 'UNPAID': return <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-transparent">Belum Dibayar</Badge>
    case 'PARTIAL': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Dibayar Sebagian</Badge>
    case 'PAID': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Lunas</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}`
);

code = code.replace(
  `<Badge variant="outline">{details.payment_status}</Badge>`,
  `{getPaymentBadge(details.payment_status)}`
);

// 2. Translations
code = code.replace(/Purchase Orders/g, "Order Pembelian");
code = code.replace(/Manage confirmed procurement orders and track fulfillment./g, "Kelola pesanan pembelian dan lacak penerimaan barang.");
code = code.replace(/New Order/g, "Order Baru");
code = code.replace(/Purchase Order Database/g, "Data Order Pembelian");
code = code.replace(/Search PO or Supplier.../g, "Cari PO atau Supplier...");
code = code.replace(/No purchase orders found./g, "Tidak ada order pembelian ditemukan.");

code = code.replace(/>PO Number</g, ">No. Order<");
code = code.replace(/>Supplier</g, ">Supplier<");
code = code.replace(/>Date</g, ">Tanggal<");
code = code.replace(/>Total</g, ">Total<");
code = code.replace(/>Receipt</g, ">Penerimaan<");
code = code.replace(/>Billing</g, ">Tagihan<");
code = code.replace(/>Action</g, ">Aksi<");
code = code.replace(/>View</g, ">Lihat<");

// Details view
code = code.replace(/Order Lines \(Three-Way Match\)/g, "Rincian Pesanan (Three-Way Match)");
code = code.replace(/>Product</g, ">Produk<");
code = code.replace(/>Ordered</g, ">Dipesan<");
code = code.replace(/>Received</g, ">Diterima<");
code = code.replace(/>Billed</g, ">Ditagih<");
code = code.replace(/No lines available./g, "Tidak ada rincian barang.");
code = code.replace(/Grand Total/g, "Total Akhir");

code = code.replace(/Procurement Details/g, "Informasi Pembelian");
code = code.replace(/Order Date/g, "Tanggal Order");
code = code.replace(/Expected Receipt/g, "Estimasi Diterima");

code = code.replace(/Receipt Status:/g, "Status Penerimaan:");
code = code.replace(/Billing Status:/g, "Status Tagihan:");
code = code.replace(/Payment Status:/g, "Status Pembayaran:");

code = code.replace(/Create Vendor Bill/g, "Buat Tagihan Vendor");
code = code.replace(/View Bill/g, "Lihat Tagihan");
code = code.replace(/Receive Goods/g, "Terima Barang");
code = code.replace(/Mark as Received/g, "Tandai Diterima");

// Top buttons
code = code.replace(/<Truck className="w-4 h-4 mr-2" \/> Receive Goods/g, `<Truck className="w-4 h-4 mr-2" /> Terima Barang`);

fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
console.log('patched frontend translations and badges');
