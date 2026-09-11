with open("backend/src/purchasing/purchasing.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "payload: { type: 'AP_PAYMENT', amount: payment.amount, method: payment.payment_method }",
    "payload: { type: 'PAYABLE', amount: payment.amount, accountId: paymentData.accountId }"
)

with open("backend/src/purchasing/purchasing.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
