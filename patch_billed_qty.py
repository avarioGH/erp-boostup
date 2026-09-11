with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    s = f.read()
s = s.replace("received_qty      Float         @default(0)", "received_qty      Float         @default(0)\n    billed_qty        Float         @default(0)")
with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(s)
