import re
import os

def fix_file(path, replacements):
    if not os.path.exists(path): return
    with open(path, 'r') as f:
        c = f.read()
    for o, n in replacements:
        c = c.replace(o, n)
    with open(path, 'w') as f:
        f.write(c)

fix_file('src/pos/pos.service.ts', [
    ('cash_account: {connect:{id:cashAccount.id}}', 'cash_account_id: cashAccount.id'),
    ('warehouse: {connect:{id:warehouseId}}', 'warehouse_id: warehouseId'),
    ('user: {connect:{id:userId}}', 'user_id: userId')
])

fix_file('src/integrations/shopee/shopee.service.ts', [
    ('user_created: { connect: { id: user_id } }', 'created_by: user_id'),
    ('const movement = await tx.stockMovement.create(', 'const movement = await this.prisma.stockMovement.create(')
])

fix_file('src/integrations/providers/payment/tripay/tripay.controller.ts', [
    ("external_type: 'TRIPAY_TRANSACTION'", "entity_type: 'TRIPAY_TRANSACTION'"),
    (", orderBy: { created_at: 'desc' }", "")
])

fix_file('src/ecommerce/ecommerce-checkout.service.ts', [
    ('constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}', 'constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private inventoryService: InventoryService) {}')
])

fix_file('src/approval/approval.service.ts', [
    ('requested_by: user_id,', ''),
    ('requester: true,', '')
])

fix_file('src/crm/crm-analytics.service.ts', [
    ("company_id: companyId, company_id: companyId", "company_id: companyId")
])

with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()
c = re.sub(r'idempotency_key\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'source\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'quotation_id\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'quotation_id\s*:\s*[a-zA-Z0-9_\.]+', '', c)
c = re.sub(r'opportunity_id\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)

with open('src/crm/crm-analytics.service.ts', 'r') as f:
    c = f.read()
c = re.sub(r'idempotency_key\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'source\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'quotation_id\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'quotation_id\s*:\s*[a-zA-Z0-9_\.]+', '', c)
c = re.sub(r'opportunity_id\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
with open('src/crm/crm-analytics.service.ts', 'w') as f:
    f.write(c)

