with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

old_code = """      const asset = await assetService.createAsset({
        companyId: c1, categoryId: acat.id, assetCode: 'AST-001', assetName: 'MacBook Pro',
        purchasePrice: 20000000, condition: 'EXCELLENT', userId: uAdminId
      });"""

new_code = """      const asset = await prisma.assetMaster.create({
        data: {
          company_id: c1, category_id: acat.id, asset_code: 'AST-001', asset_name: 'MacBook Pro',
          purchase_price: 20000000, condition: 'EXCELLENT', is_capitalized: false
        } as any
      });"""

c = c.replace(old_code, new_code)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

