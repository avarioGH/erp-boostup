const fs = require('fs');
let r = fs.readFileSync('frontend/src/app/pos/new-transaction/page.tsx', 'utf8');

// 1. Add customerAddress to setReceiptData
const oldSet = "   customerName: isNewCustomer ? newCustomerName : (customers.find((c: any) => c.id === selectedCustomerId)?.name || ''),\r\n });";
const newSet = "   customerName: isNewCustomer ? newCustomerName : (customers.find((c: any) => c.id === selectedCustomerId)?.name || ''),\r\n   customerAddress: isNewCustomer ? newCustomerAddress : (customers.find((c: any) => c.id === selectedCustomerId)?.address || ''),\r\n });";

if (r.includes(oldSet)) {
  r = r.replace(oldSet, newSet);
} else {
  // Try LF
  const oldSetLF = "   customerName: isNewCustomer ? newCustomerName : (customers.find((c: any) => c.id === selectedCustomerId)?.name || ''),\n });";
  const newSetLF = "   customerName: isNewCustomer ? newCustomerName : (customers.find((c: any) => c.id === selectedCustomerId)?.name || ''),\n   customerAddress: isNewCustomer ? newCustomerAddress : (customers.find((c: any) => c.id === selectedCustomerId)?.address || ''),\n });";
  if (r.includes(oldSetLF)) r = r.replace(oldSetLF, newSetLF);
  else {
    // Try any spacing
    const oldSet2 = "customerName: isNewCustomer ? newCustomerName : (customers.find((c) => c.id === selectedCustomerId)?.name || ''),\r\n });";
    const newSet2 = "customerName: isNewCustomer ? newCustomerName : (customers.find((c) => c.id === selectedCustomerId)?.name || ''),\r\n   customerAddress: isNewCustomer ? newCustomerAddress : (customers.find((c) => c.id === selectedCustomerId)?.address || ''),\r\n });";
    if (r.includes(oldSet2)) r = r.replace(oldSet2, newSet2);
    else console.log('Could not find customerName in setReceiptData');
  }
}

// 2. Add Alamat to the receipt UI
const oldUI = `{receiptData.customerName && (
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Pelanggan</span>
                    <span className="font-semibold text-gray-700">{receiptData.customerName}</span>
                  </div>
                )}`;
                
const newUI = `{receiptData.customerName && (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Pelanggan</span>
                      <span className="font-semibold text-gray-700">{receiptData.customerName}</span>
                    </div>
                    {receiptData.customerAddress && (
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Alamat</span>
                        <span className="font-medium text-gray-700 text-right max-w-[60%] line-clamp-2">{receiptData.customerAddress}</span>
                      </div>
                    )}
                  </>
                )}`;

if (r.includes(oldUI)) {
  r = r.replace(oldUI, newUI);
} else {
  // Try CRLF
  const oldUICRLF = oldUI.replace(/\n/g, '\r\n');
  const newUICRLF = newUI.replace(/\n/g, '\r\n');
  if (r.includes(oldUICRLF)) {
    r = r.replace(oldUICRLF, newUICRLF);
  } else {
    console.log('Could not find customerName in receipt UI');
  }
}

fs.writeFileSync('frontend/src/app/pos/new-transaction/page.tsx', r);
console.log('SUCCESS: customerAddress added to receipt');
