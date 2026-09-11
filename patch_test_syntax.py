with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("console.log('", "console.log(`")
c = c.replace("TEST CASE COUNT');", "TEST CASE COUNT`);")

c = c.replace('console.log("', "console.log(`")
c = c.replace('TEST CASE COUNT");', "TEST CASE COUNT`);")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

