with open('src/pos/pos.service.ts', 'r') as f:
    c = f.read()

c = c.replace("cash_account: { connect: { id: cashAccountId } },", "cash_account_id: cashAccountId,")
c = c.replace("warehouse: { connect: { id: warehouseId } },", "warehouse_id: warehouseId,")
c = c.replace("user: { connect: { id: userId } },", "user_id: userId,")
c = c.replace("user_created: { connect: { id: userId } }", "created_by: userId")

with open('src/pos/pos.service.ts', 'w') as f:
    f.write(c)

with open('src/ecommerce/ecommerce-checkout.service.ts', 'r') as f:
    c = f.read()
c = c.replace("constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}", "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private inventoryService: any) {}")
with open('src/ecommerce/ecommerce-checkout.service.ts', 'w') as f:
    f.write(c)
