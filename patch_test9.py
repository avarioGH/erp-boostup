with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("{ id: actCashId, company_id: c1, account_code: '1000', account_name: 'Cash', account_type_id: actTypeAssetId },", "{ id: actCashId, company_id: c1, account_code: '1000', account_name: 'Cash', account_type_id: actTypeAssetId },\n    { id: new ObjectId().toHexString(), company_id: c1, account_code: '1300', account_name: 'Persediaan Barang', account_type_id: actTypeAssetId },\n    { id: new ObjectId().toHexString(), company_id: c1, account_code: '5000', account_name: 'Harga Pokok Penjualan', account_type_id: actTypeRevId },")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
