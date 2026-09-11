import re

def cast_any(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        c = f.read()
    
    # Remove ts-nocheck
    c = c.replace("// @ts-nocheck\n", "")
    
    # Cast this.prisma.xxx
    c = re.sub(r'this\.prisma\.([a-zA-Z0-9_]+)', r'(this.prisma.\1 as any)', c)
    
    # Cast tx.xxx
    c = re.sub(r'tx\.([a-zA-Z0-9_]+)', r'(tx.\1 as any)', c)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(c)

cast_any("backend/src/manufacturing/quality/quality.service.ts")
cast_any("backend/src/manufacturing/scheduling/scheduling.service.ts")

