with open('src/reports/services/financial-report.service.ts', 'r') as f:
    c = f.read()

c = c.replace("const data = [];", "const data: any[] = [];")

with open('src/reports/services/financial-report.service.ts', 'w') as f:
    f.write(c)

