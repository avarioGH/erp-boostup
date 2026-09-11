with open("backend/src/integrations/providers/payment/tripay/tripay.controller.ts", "r", encoding="utf-8") as f:
    c = f.read()
import re
c = re.sub(r".*@ts-nocheck.*?\n", "", c)
with open("backend/src/integrations/providers/payment/tripay/tripay.controller.ts", "w", encoding="utf-8") as f:
    f.write(c)
