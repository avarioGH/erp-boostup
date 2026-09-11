with open("backend/src/hr/hr.service.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()
in_tx = False
for i, line in enumerate(lines):
    if "$transaction" in line:
        in_tx = True
    if in_tx and "this.prisma" in line and not "$transaction" in line:
        print(f"Found this.prisma inside tx at line {i+1}: {line.strip()}")
    if in_tx and "});" in line:
        pass # Not a robust parser, but good enough for a quick check
