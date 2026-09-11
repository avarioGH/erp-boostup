with open("backend/src/finance/payment/payment.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("'payment.received'", "'payment.processed'")

with open("backend/src/finance/payment/payment.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
