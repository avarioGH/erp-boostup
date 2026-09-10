with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("  const app = await NestFactory.create", "  try {\n  const app = await NestFactory.create")
c = c.replace("  try {\n    // T1. NORMAL GOODS RECEIPT", "    // T1. NORMAL GOODS RECEIPT")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

