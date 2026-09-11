with open('backend/test/verify.erp.ts', 'r', encoding='utf-8') as f:
    c = f.read()

endpoints_expanded = """
  const endpoints = [
    { module: 'Inventory', path: '/inventory/categories', method: 'GET' },
    { module: 'Inventory', path: '/inventory/categories', method: 'POST' },
    { module: 'Inventory', path: '/inventory/categories/1', method: 'DELETE' },
    { module: 'Inventory', path: '/inventory/products', method: 'GET' },
    { module: 'POS', path: '/pos/shifts', method: 'GET' },
    { module: 'POS', path: '/pos/shifts', method: 'POST' },
    { module: 'POS', path: '/pos/orders', method: 'POST' },
    { module: 'Purchasing', path: '/purchasing/purchase-orders', method: 'GET' },
    { module: 'Purchasing', path: '/purchasing/purchase-orders', method: 'POST' },
    { module: 'Purchasing', path: '/purchasing/purchase-orders/1', method: 'PUT' },
    { module: 'Finance', path: '/finance/cash-accounts', method: 'GET' },
    { module: 'Finance', path: '/finance/cash-accounts', method: 'POST' },
    { module: 'Finance', path: '/finance/cash-receipts', method: 'POST' },
    { module: 'HR', path: '/hr/employees', method: 'GET' },
    { module: 'HR', path: '/hr/employees', method: 'POST' },
    { module: 'Manufacturing', path: '/manufacturing/bom', method: 'GET' },
    { module: 'Manufacturing', path: '/manufacturing/bom', method: 'POST' },
    { module: 'Manufacturing', path: '/manufacturing/mo', method: 'POST' },
    { module: 'MRP', path: '/mrp/runs', method: 'GET' },
    { module: 'MRP', path: '/mrp/runs', method: 'POST' },
    { module: 'Accounting', path: '/accounting/journals', method: 'GET' },
    { module: 'Accounting', path: '/accounting/journals', method: 'POST' },
    { module: 'Accounting', path: '/accounting/reports/trial-balance', method: 'GET' },
    { module: 'CRM', path: '/crm/customers', method: 'GET' },
    { module: 'CRM', path: '/crm/customers', method: 'POST' },
    { module: 'Reports', path: '/reports/financial', method: 'GET' },
    { module: 'Reports', path: '/reports/inventory', method: 'GET' },
  ];
"""
import re
c = re.sub(r'const endpoints = \[\s*\{ module: \'Inventory\', path: \'/inventory/categories\', method: \'GET\' \},.*?\];', endpoints_expanded, c, flags=re.DOTALL)

with open('backend/test/verify.erp.ts', 'w', encoding='utf-8') as f:
    f.write(c)
