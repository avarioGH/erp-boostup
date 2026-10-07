const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

const targetFunction = `  const createVendorBill = async () => {`;
const replacementFunction = `  const fastPay = async () => {
    if (!selectedDoc) return;
    try {
      setDocLoading(true);
      
      // Step 1: Create Bill if unbilled
      let invoiceRes;
      if (details.bill_status !== 'BILLED') {
         invoiceRes = await FinanceAPI.createVendorBill(selectedDoc.id);
      } else {
         // Find the existing bill
         const res = await api.get('/finance/invoices?type=VENDOR_BILL');
         const bills = res.data?.data || res.data || [];
         invoiceRes = bills.find((b: any) => b.purchase_order_id === selectedDoc.id);
      }
      
      const invoiceId = invoiceRes?.id;
      if (!invoiceId) throw new Error("Gagal menemukan/membuat tagihan");

      // Step 2: Pay the bill
      const amount = invoiceRes.remaining_amount || invoiceRes.total || selectedDoc.total_amount;
      await api.post('/finance/payments', {
        invoiceId,
        amount,
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Bayar Langsung via PO'
      });
      
      alert("Pembayaran berhasil dicatat!");
      await fetchOrders();
      setSelectedDoc(null);
    } catch (e: any) {
      alert(e.response?.data?.message || e.message || "Gagal melakukan pembayaran.");
    } finally {
      setDocLoading(false);
    }
  }

  const createVendorBill = async () => {`;

code = code.replace(targetFunction, replacementFunction);

const targetButton = `          {details.status === 'CONFIRMED' && details.receipt_status !== 'PENDING' && details.bill_status !== 'BILLED' && (
            <Button onClick={createVendorBill} variant="outline" className="border-emerald-200 text-primary hover:bg-emerald-50">
              <FileOutput className="w-4 h-4 mr-2" /> Create Vendor Bill
            </Button>
          )}`;

const replacementButton = `          {details.status === 'CONFIRMED' && details.receipt_status !== 'PENDING' && details.bill_status !== 'BILLED' && (
            <Button onClick={createVendorBill} variant="outline" className="border-emerald-200 text-primary hover:bg-emerald-50">
              <FileOutput className="w-4 h-4 mr-2" /> Create Vendor Bill
            </Button>
          )}

          {details.status === 'CONFIRMED' && details.payment_status !== 'PAID' && (
            <Button onClick={fastPay} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <span className="w-4 h-4 mr-2 text-xl leading-none -mt-1 font-bold">?</span> Bayar Langsung
            </Button>
          )}`;

code = code.replace(targetButton, replacementButton);

fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
console.log('patched frontend PO page with Fast Pay');
