with open('src/integrations/shopee/shopee.service.ts', 'r') as f:
    c = f.read()

c = c.replace("'system'", "'000000000000000000000000'")

with open('src/integrations/shopee/shopee.service.ts', 'w') as f:
    f.write(c)

with open('src/pos/pos.service.ts', 'r') as f:
    c = f.read()

c = c.replace("'SYSTEM'", "'000000000000000000000000'")

with open('src/pos/pos.service.ts', 'w') as f:
    f.write(c)
