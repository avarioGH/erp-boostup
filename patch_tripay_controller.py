with open("backend/src/integrations/providers/payment/tripay/tripay.controller.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("// @ts-nocheck", "")
c = c.replace("", "") # weird char

with open("backend/src/integrations/providers/payment/tripay/tripay.controller.ts", "w", encoding="utf-8") as f:
    f.write(c)
