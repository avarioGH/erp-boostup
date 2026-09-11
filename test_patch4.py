with open('backend/test/verify.erp.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("console.log('\n--- RESULTS ---');", "console.log('--- RESULTS ---');")

with open('backend/test/verify.erp.ts', 'w', encoding='utf-8') as f:
    f.write(c)
