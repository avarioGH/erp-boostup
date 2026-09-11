import os

replacements = {
    "frontend/src/app/crm/customers/page.tsx": [
        (
            'const res = await fetch("https://api.erp.boostup.id/customers", {\n          method: "POST",\n          headers: { \n            "Authorization": `Bearer ${token}`,\n            "Content-Type": "application/json"\n          },\n          body: JSON.stringify({ name, phone, email })\n        })',
            'const res = await api.post("/customers", { name, phone, email })'
        ),
        (
            'if (res.ok)',
            'if (res.status === 200 || res.status === 201)'
        )
    ],
    "frontend/src/app/hr/employees/page.tsx": [
        (
            'const res = await fetch("https://api.erp.boostup.id/hr/employees", {\n          method: "POST",\n          headers: { \n            "Authorization": `Bearer ${token}`,\n            "Content-Type": "application/json"\n          },\n          body: JSON.stringify({\n            firstName: formData.firstName,\n            lastName: formData.lastName,\n            email: formData.email,\n            position: formData.position,\n            basicSalary: formData.basicSalary\n          })\n        })',
            'const res = await api.post("/hr/employees", formData)'
        ),
        (
            'if (res.ok)',
            'if (res.status === 200 || res.status === 201)'
        ),
        (
            'await fetch(`https://api.erp.boostup.id/hr/employees/${selectedEmp.id}/biometric`, {\n          method: "POST",\n          headers: { \n            "Authorization": `Bearer ${token}`,\n            "Content-Type": "application/json"\n          },\n          body: JSON.stringify({\n            employeeId: selectedEmp.id,\n            rightThumb: "base64_simulated_right_thumb_template",\n            leftThumb: "base64_simulated_left_thumb_template"\n          })\n        })',
            'await api.post(`/hr/employees/${selectedEmp.id}/biometric`, {\n            employeeId: selectedEmp.id,\n            rightThumb: "base64_simulated_right_thumb_template",\n            leftThumb: "base64_simulated_left_thumb_template"\n          })'
        )
    ],
    "frontend/src/app/hr/payroll/page.tsx": [
        (
            'const res = await fetch("https://api.erp.boostup.id/hr/payroll", {\n          method: "POST",\n          headers: { \n            "Authorization": `Bearer ${token}`,\n            "Content-Type": "application/json"\n          },\n          body: JSON.stringify({\n            employeeId: formData.employeeId,\n            period: formData.period,\n            daysWorked: Number(formData.daysWorked),\n            overtimeHours: Number(formData.overtimeHours)\n          })\n        })',
            'const res = await api.post("/hr/payroll", {\n            employeeId: formData.employeeId,\n            period: formData.period,\n            daysWorked: Number(formData.daysWorked),\n            overtimeHours: Number(formData.overtimeHours)\n          })'
        ),
        (
            'if (res.ok)',
            'if (res.status === 200 || res.status === 201)'
        )
    ],
    "frontend/src/app/inventory/warehouses/page.tsx": [
        (
            'const res = await fetch("https://api.erp.boostup.id/inventory/warehouses", {\n          method: "POST",\n          headers: { \n            "Authorization": `Bearer ${token}`,\n            "Content-Type": "application/json"\n          },\n          body: JSON.stringify({\n            name: formData.name,\n            location: formData.location,\n            capacity: Number(formData.capacity),\n            type: formData.type\n          })\n        })',
            'const res = await api.post("/inventory/warehouses", {\n            name: formData.name,\n            location: formData.location,\n            capacity: Number(formData.capacity),\n            type: formData.type\n          })'
        ),
        (
            'if (res.ok)',
            'if (res.status === 200 || res.status === 201)'
        )
    ],
    "frontend/src/app/login/page.tsx": [
        (
            'const res = await fetch("https://api.erp.boostup.id/auth/login", {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ username, password }),\n        })',
            'const res = await api.post("/auth/login", { username, password })'
        ),
        (
            'if (res.ok) {\n        const data = await res.json()',
            'if (res.status === 200 || res.status === 201) {\n        const data = res.data'
        )
    ],
    "frontend/src/app/platform/ai/page.tsx": [
        (
            'const res = await fetch("https://api.erp.boostup.id/platform/ai/ask", {\n          method: "POST",\n          headers: { \n            "Authorization": `Bearer ${token}`,\n            "Content-Type": "application/json"\n          },\n          body: JSON.stringify({ query: input })\n        })',
            'const res = await api.post("/platform/ai/ask", { query: input })'
        ),
        (
            'if (res.ok) {\n        const data = await res.json()',
            'if (res.status === 200 || res.status === 201) {\n        const data = res.data'
        )
    ],
    "frontend/src/app/platform/page.tsx": [
        (
            'await fetch("https://api.erp.boostup.id/platform/settings", {\n        method: "POST",\n        headers: { \n          "Authorization": `Bearer ${token}`,\n          "Content-Type": "application/json"\n        },\n        body: JSON.stringify(formData)\n      })',
            'await api.post("/platform/settings", formData)'
        ),
        (
            'const res = await fetch("https://api.erp.boostup.id/platform/api-keys", {\n        method: "POST",\n        headers: { \n          "Authorization": `Bearer ${token}`,\n          "Content-Type": "application/json"\n        },\n        body: JSON.stringify({ name: "New API Key" })\n      })',
            'const res = await api.post("/platform/api-keys", { name: "New API Key" })'
        ),
        (
            'if (res.ok)',
            'if (res.status === 200 || res.status === 201)'
        )
    ]
}

for file, changes in replacements.items():
    if not os.path.exists(file): continue
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()
    
    for old, new in changes:
        c = c.replace(old, new)
        
    with open(file, "w", encoding="utf-8") as f:
        f.write(c)

print("Manual replace done.")
