with open('backend/src/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()
print(c.find("        // 3. Finance Transaction"))
