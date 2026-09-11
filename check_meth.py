import re
with open("backend/src/inventory/inventory.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

print("methods:")
for m in re.finditer(r"async ([a-zA-Z0-9]+)\(", c):
    print(m.group(1))
