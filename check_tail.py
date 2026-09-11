with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

print("Variables near the end:")
lines = c.split("\n")
for i, line in enumerate(lines[-30:]):
    print(line)
