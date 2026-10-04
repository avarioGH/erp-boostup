# Prompt Instruksi: Implementasi Fish Procurement & Unified Business Partner

*Salin seluruh teks di bawah ini dan tempelkan ke mesin ERP (AI) Anda untuk mengeksekusi perombakan sistem sesuai spesifikasi bisnis yang telah disepakati.*

---

**TUGAS UTAMA:**
Implementasikan fitur "Fish Procurement" (Pembelian Ikan dari Nelayan) dan gabungkan entitas Pelanggan/Supplier menjadi "Unified Business Partner" (Mitra) dengan logika *Netting* (Kompensasi) Piutang dan Hutang.

**LANGKAH 1: PEROMBAKAN DATABASE (PRISMA SCHEMA)**
1. Jadikan model `Customer` yang sudah ada sebagai model utama untuk *Business Partner*. 
2. Tambahkan kolom `roles String[] @default(["CUSTOMER"])` ke model `Customer`. Role yang valid adalah `CUSTOMER`, `SUPPLIER`, atau keduanya.
3. Ubah semua relasi di `PurchaseOrder`, `GoodsReceipt`, dan model pembelian lainnya yang tadinya merujuk ke `Supplier`, agar merujuk ke model `Customer`.
4. Hapus model `Supplier` dari `schema.prisma`.
5. Jalankan `npx prisma db push` atau `npx prisma generate`.

**LANGKAH 2: BACKEND - MODUL PEMBELIAN IKAN & NETTING**
1. Buat/sesuaikan `PurchaseController` untuk memproses "Pembelian Ikan" secara atomik:
   - Terima payload: `partner_id`, `warehouse_id`, `date`, `items` (product_id, qty, unit_price), `paid_amount`, `payment_method`.
   - Gunakan Prisma `$transaction` agar proses ini atomik.
   - Buat `PurchaseOrder` (Status: COMPLETED).
   - Buat `GoodsReceipt` otomatis.
   - Panggil `InventoryService.receiveStock` untuk menambah `WarehouseStock` dan membuat `StockMovement` (PURCHASE_IN).
   - Jika `paid_amount < total`, catat sisa hutang (Accounts Payable) ke Mitra tersebut. Jika ada pembayaran, buat record `Payment`.
2. Buat `PartnerNettingService` (Layanan Kompensasi):
   - Buat endpoint `POST /finance/netting`.
   - Terima `partner_id` dan nominal kompensasi.
   - Potong saldo tagihan berjalan (*Sales Invoice* yang belum lunas) terhadap *Purchase Invoice/PO* yang belum dibayar dari mitra yang sama.
   - Buat record `PaymentAllocation` silang agar histori transaksinya tetap utuh (Gross transaction tidak dihapus/diubah).

**LANGKAH 3: FRONTEND - ANTARMUKA MITRA (BUSINESS PARTNER)**
1. Ubah teks dan navigasi menu "Pelanggan" dan "Supplier" menjadi **"Mitra (Partner)"**.
2. Di halaman pembuatan Mitra (`/crm/partners/create`), tambahkan *checkbox* Role: [ ] Pelanggan, [ ] Penjual (Nelayan).
3. Di halaman Detail Mitra (`/crm/partners/[id]`), tambahkan *Card* **"Saldo Mitra"**:
   - Tampilkan "Hutang Perusahaan" (Total AP).
   - Tampilkan "Piutang ke Mitra" (Total AR).
   - Tampilkan "Net Balance" (Selisih).
   - Jika Net Balance mengharuskan perusahaan membayar, tampilkan "Status: Hutang ke Mitra". Sebaliknya, "Piutang dari Mitra".
4. Tambahkan tab **"Kompensasi / Netting"** di halaman Detail Mitra yang memuat tabel histori pemotongan hutang-piutang.

**LANGKAH 4: FRONTEND - FORM PEMBELIAN IKAN**
1. Buat halaman `/inventory/purchase-fish/create`.
2. Sediakan form ringkas: Tanggal, Gudang, Mitra (pilih yang ber-role SUPPLIER), dan Rincian Ikan (Produk, Qty, Harga Beli Nelayan).
3. Sediakan input pembayaran: Tunai / Kredit / Sebagian.
4. Auto-kalkulasi Subtotal dan Sisa Hutang.
5. Saat di-submit, panggil endpoint atomik yang dibuat di Langkah 2.

**BATASAN & ATURAN KRITIS (CRITICAL RULES):**
1. **NO DUPLICATION**: Jangan buat model `FishPurchase` baru jika `PurchaseOrder` sudah ada. Jangan buat 2 record terpisah untuk 1 orang (Pak Budi #1 dan Pak Budi #2). Semuanya harus 1 ID Mitra.
2. **ATOMICITY**: Terima barang, tambah stok, dan catat hutang harus terjadi di dalam 1 Prisma Transaction. Jika salah satu gagal, batalkan semua (*Rollback*).
3. **NETTING INTEGRITY**: Kompensasi *TIDAK BOLEH* mengubah/menghapus nominal kotor (gross) dari transaksi asli. Gunakan relasi pembayaran/alokasi untuk memotong hutang.
4. **PRICE HISTORY**: `unit_price` di `PurchaseOrderItem` tidak boleh mengubah `selling_price` di master Produk.

*Harap eksekusi secara berurutan dan laporkan jika ada error TypeScript saat build!*
