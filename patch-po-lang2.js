const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

// Replace Receipt Badge Status Strings
code = code.replace(/Pending Receipt/g, "Menunggu Barang");
code = code.replace(/Partially Received/g, "Diterima Sebagian");
code = code.replace(/Fully Received/g, "Diterima Penuh");

// Replace Bill Badge Status Strings
code = code.replace(/Unbilled/g, "Belum Ditagih");
// Billed was probably replaced partially since I saw "Ditagih"
code = code.replace(/>Billed</g, ">Sudah Ditagih<");

// Update style of GetReceiptBadge
code = code.replace(/<Badge variant="outline" className="text-amber-600 border-amber-200">/g, `<Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">`);
code = code.replace(/<Badge variant="outline" className="text-blue-600 border-blue-200">/g, `<Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">`);
code = code.replace(/<Badge className="">/g, `<Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">`);

// Replace Payment Badges if missing
if (!code.includes("getPaymentBadge")) {
  code = code.replace(
    `const getBillBadge =`,
    `const getPaymentBadge = (status: string) => {
  switch(status) {
    case 'UNPAID': return <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-transparent">Belum Dibayar</Badge>;
    case 'PARTIAL': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Dibayar Sebagian</Badge>;
    case 'PAID': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Lunas</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

const getBillBadge =`
  );
  
  code = code.replace(/<Badge variant="outline">\{details\.payment_status\}<\/Badge>/g, `{getPaymentBadge(details.payment_status)}`);
}

code = code.replace(/>View</g, ">Lihat<");

fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
console.log('patched translation 2');
