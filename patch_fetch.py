import os
import re

files_to_patch = [
    "frontend/src/app/crm/customers/page.tsx",
    "frontend/src/app/crm/page.tsx",
    "frontend/src/app/finance/gl/page.tsx",
    "frontend/src/app/hr/employees/page.tsx",
    "frontend/src/app/hr/payroll/page.tsx",
    "frontend/src/app/hr/page.tsx",
    "frontend/src/app/inventory/warehouses/page.tsx",
    "frontend/src/app/login/page.tsx",
    "frontend/src/app/platform/ai/page.tsx",
    "frontend/src/app/platform/page.tsx",
]

for file in files_to_patch:
    if not os.path.exists(file): continue
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()

    # Add import api if not exists
    if "from \"@/lib/api\"" not in c and "from '@/lib/api'" not in c:
        c = "import { api } from \"@/lib/api\"\n" + c

    # This is a bit risky to do with regex alone due to the structure of await fetch().json().
    # Let's replace the `const res = await fetch("https://api.erp.boostup.id/...")` blocks
    # Actually, let's just do it manually for the most important ones or write a smarter replacement.
    
    # We will do a generic replacement for simple fetch:
    # fetch("https://api.erp.boostup.id/X", { headers: { ... } }) -> api.get("/X")
    c = re.sub(
        r'fetch\("https://api\.erp\.boostup\.id(/[^"]+)",\s*\{\s*headers:\s*\{\s*"Authorization":\s*`Bearer \$\{token\}`\s*\}\s*\}\)',
        r'api.get("\1")',
        c
    )
    
    with open(file, "w", encoding="utf-8") as f:
        f.write(c)

print("Pass 1 done.")
