with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("let total = 0, pass = 0, fail = 0, skipped = 0;", "let total = 0, pass = 0, fail = 0, skipped = 0;\nlet assertionTotal = 0, assertionPass = 0, assertionFail = 0;")
c = c.replace("function assert(cond: boolean, msg: string) {", "function assert(cond: boolean, msg: string) {\n  assertionTotal++;\n  if (cond) { assertionPass++; }\n  else { assertionFail++; }")
c = c.replace("function assertEq(a: any, b: any, msg: string) {", "function assertEq(a: any, b: any, msg: string) {\n  assertionTotal++;\n  if (a === b) { assertionPass++; }\n  else { assertionFail++; }")

results_str = """
  console.log('--- RESULTS ---');
  console.log('\\nTEST CASE COUNT');
  console.log('TOTAL: ' + (total + skipped));
  console.log('PASS: ' + pass);
  console.log('FAIL: ' + fail);
  console.log('SKIPPED/N/A: ' + skipped);
  
  console.log('\\nINDIVIDUAL ASSERTION COUNT');
  console.log('TOTAL: ' + assertionTotal);
  console.log('PASS: ' + assertionPass);
  console.log('FAIL: ' + assertionFail);
"""
c = c.replace("console.log('--- RESULTS ---');\n  console.log('TOTAL: ' + (total + skipped));\n  console.log('PASS: ' + pass);\n  console.log('FAIL: ' + fail);\n  console.log('SKIPPED/N/A: ' + skipped);", results_str)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
