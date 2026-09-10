with open('src/inventory/fifo.engine.ts', 'r') as f:
    c = f.read()

c = c.replace("const consumed = [];", "const consumed: FifoConsumptionResult[] = [];")

with open('src/inventory/fifo.engine.ts', 'w') as f:
    f.write(c)

