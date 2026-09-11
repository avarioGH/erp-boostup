import os
import re

for root, dirs, files in os.walk("frontend/src/app"):
    for file in files:
        if not file.endswith(".tsx"): continue
        path = os.path.join(root, file)
        with open(path, "r", encoding="utf-8") as f:
            c = f.read()
            
        original_c = c

        if "https://api.erp.boostup.id" not in c: continue
        
        # Replace simple GET requests
        # fetch("https://api.erp.boostup.id/foo", { headers... })
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id([^"]+)",[^)]+\)',
            r'api.get("\1")',
            c
        )
        
        # Actually this is too risky if it's a POST.
        # Let's restore and do a more precise replacement.
        c = original_c
        
        # Let's replace login POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/auth/login"[\s\S]*?body:\s*JSON\.stringify\(\{ username, password \}\)[\s\S]*?\}\)',
            r'api.post("/auth/login", { username, password })',
            c
        )
        c = re.sub(r'const data = await res\.json\(\)', r'const data = res.data', c)
        c = re.sub(r'if \(res\.ok\)', r'if (res.status === 200 || res.status === 201)', c)
        
        # Inventory warehouse POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/inventory/warehouses"[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post("/inventory/warehouses", {\1})',
            c
        )
        
        # HR employees POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/hr/employees"[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post("/hr/employees", {\1})',
            c
        )
        
        # HR employees biometric POST
        c = re.sub(
            r'fetch\(`https://api\.erp\.boostup\.id/hr/employees/\$\{selectedEmp\.id\}/biometric`[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post(`/hr/employees/${selectedEmp.id}/biometric`, {\1})',
            c
        )
        
        # CRM customers POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/customers"[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post("/customers", {\1})',
            c
        )
        
        # HR payroll POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/hr/payroll"[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post("/hr/payroll", {\1})',
            c
        )
        
        # Platform AI ask POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/platform/ai/ask"[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post("/platform/ai/ask", {\1})',
            c
        )
        
        # Platform settings POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/platform/settings"[\s\S]*?body:\s*JSON\.stringify\(formData\)[\s\S]*?\}\)',
            r'api.post("/platform/settings", formData)',
            c
        )
        
        # Platform api-keys POST
        c = re.sub(
            r'fetch\("https://api\.erp\.boostup\.id/platform/api-keys"[\s\S]*?body:\s*JSON\.stringify\(\{([\s\S]*?)\}\)[\s\S]*?\}\)',
            r'api.post("/platform/api-keys", {\1})',
            c
        )

        with open(path, "w", encoding="utf-8") as f:
            f.write(c)

print("api.post fixes with wildcard done.")
