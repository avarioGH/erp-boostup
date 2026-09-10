with open('test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace("../src/finance/accounting/gl.service", "../src/finance/gl/gl.service")
c = c.replace("import { RolesGuard } from '../src/auth/permissions.guard';", "")
c = c.replace("name: 'Cash', ", "account_name: 'Cash', ")
c = c.replace("name: 'Revenue', ", "account_name: 'Revenue', ")
c = c.replace("period_name: 'Jan 2026', ", "")
c = c.replace("is_stock: true, can_sell: true", "")

with open('test/verify.erp.ts', 'w') as f:
    f.write(c)
