with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("{ id: actRevId, company_id: c1, account_code: '4000', account_name: 'Sales', account_type_id: actTypeRevId },",
"{ id: actRevId, company_id: c1, account_code: '4000', account_name: 'Sales', account_type_id: actTypeRevId },\n      { id: new ObjectId().toHexString(), company_id: c1, account_code: '1200', account_name: 'Piutang Usaha', account_type_id: actTypeAssetId },")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
