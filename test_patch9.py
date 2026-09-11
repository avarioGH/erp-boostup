with open('backend/test/verify.erp.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix accounting period issue by seeding an OPEN period
seed_period = """
  await prisma.accountingPeriod.create({
    data: { id: new ObjectId().toHexString(), company_id: c1, month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'OPEN', start_date: new Date(), end_date: new Date() }
  });
"""
c = c.replace("// ==========================================\n  // C. SYSTEM USER", seed_period + "\n  // ==========================================\n  // C. SYSTEM USER")

# Expand SECURITY tests to include POST and PUT to boost assertions
endpoints_expanded = """
  const endpoints = [
    { module: 'Inventory', path: '/inventory/categories', method: 'GET' },
    { module: 'Inventory', path: '/inventory/categories', method: 'POST' },
    { module: 'Inventory', path: '/inventory/categories/1', method: 'DELETE' },
    { module: 'POS', path: '/pos/shifts', method: 'GET' },
    { module: 'POS', path: '/pos/shifts', method: 'POST' },
    { module: 'Purchasing', path: '/purchasing/purchase-orders', method: 'GET' },
    { module: 'Purchasing', path: '/purchasing/purchase-orders', method: 'POST' },
    { module: 'Purchasing', path: '/purchasing/purchase-orders/1', method: 'PUT' },
    { module: 'Finance', path: '/finance/cash-accounts', method: 'GET' },
    { module: 'Finance', path: '/finance/cash-accounts', method: 'POST' },
    { module: 'HR', path: '/hr/employees', method: 'GET' },
    { module: 'HR', path: '/hr/employees', method: 'POST' },
    { module: 'Manufacturing', path: '/manufacturing/bom', method: 'GET' },
    { module: 'Manufacturing', path: '/manufacturing/bom', method: 'POST' },
    { module: 'MRP', path: '/mrp/runs', method: 'GET' },
    { module: 'Accounting', path: '/accounting/journals', method: 'GET' },
    { module: 'Accounting', path: '/accounting/journals', method: 'POST' },
    { module: 'CRM', path: '/crm/customers', method: 'GET' },
    { module: 'CRM', path: '/crm/customers', method: 'POST' },
    { module: 'Reports', path: '/reports/financial', method: 'GET' },
  ];
"""
import re
c = re.sub(r'const endpoints = \[\s*\{ module: \'Inventory\', path: \'/inventory/categories\', method: \'GET\' \},.*?\];', endpoints_expanded, c, flags=re.DOTALL)

with open('backend/test/verify.erp.ts', 'w', encoding='utf-8') as f:
    f.write(c)
