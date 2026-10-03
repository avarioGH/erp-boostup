const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");
content = content.replace("const [paymentMethod, paidAmount: paidAmount || 0, setPaymentMethod] = useState(\"CASH\")", 
"const [paymentMethod, setPaymentMethod] = useState(\"CASH\")");
fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

