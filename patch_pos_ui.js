const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

content = content.replace("const [paymentMethod, setPaymentMethod] = useState(\"CASH\")", 
`const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paidAmount, setPaidAmount] = useState<number | "">(0)`);

content = content.replace("useEffect(() => {\n    setIdempotencyKey(crypto.randomUUID())\n  }, [])", 
`useEffect(() => {
    setIdempotencyKey(crypto.randomUUID())
  }, [])

  useEffect(() => {
    if (isPaymentOpen) setPaidAmount(total)
  }, [isPaymentOpen, total])`);

content = content.replace("paymentMethod,", "paymentMethod, paidAmount: paidAmount || 0,");

const amountInput = `<div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Jumlah Pembayaran</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : "")}
                className="w-full pl-9 pr-3 py-3 rounded-md border border-border bg-background font-semibold text-lg"
              />
            </div>
            {(paidAmount || 0) > total && (
               <p className="text-xs text-red-500 font-medium mt-1">Jumlah pembayaran melebihi sisa tagihan.</p>
            )}
            <div className="flex justify-between items-center text-sm font-medium mt-2">
              <span className="text-muted-foreground">Sisa Tagihan:</span>
              <span className="text-foreground">{formatIDR(Math.max(0, total - (paidAmount || 0)))}</span>
            </div>
          </div>`;

content = content.replace("<div className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">", amountInput + "\n\n          <p className=\"text-sm font-medium text-foreground mt-4\">Metode Pembayaran</p>\n          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-3\">");

content = content.replace("disabled={isCheckingOut}", "disabled={isCheckingOut || (paidAmount || 0) > total}");

fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

