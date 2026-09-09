const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/process\.env\.DATABASE_URL = replSet\.getUri\(\) \+ 'erp_final\?replicaSet=testset';/g, "process.env.DATABASE_URL = replSet.getUri().replace('/?', '/erp_final?');");
fs.writeFileSync('test/final.certification.ts', code);
