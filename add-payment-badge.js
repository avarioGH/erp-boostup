const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

if (!code.includes("const getPaymentBadge")) {
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
  fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
  console.log("getPaymentBadge added");
}
