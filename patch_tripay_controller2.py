with open("backend/src/integrations/providers/payment/tripay/tripay.controller.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = [line for line in lines if "ts-nocheck" not in line and "" not in line]

with open("backend/src/integrations/providers/payment/tripay/tripay.controller.ts", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
