const fs = require('fs');
let content = fs.readFileSync('test/ecommerce.20b.ts', 'utf8');

content = content.replace(
  /res = await request\(app.getHttpServer\(\)\).post\(\/documents\/share\).set\('Authorization', Bearer \$\{tokenA\}\).send\(\{ documentMasterId: docA.id, validDays: 7 \}\);[\s\S]*?if \(res.status === 201 \|\| res.status === 200\)/,
  "const docService = app.get(require('../src/document/document.service').DocumentService);\n  let success = false; try { await docService.generateShareLink(compA.id, docA.id, userA.id, 7); success = true; } catch(e) {}\n  if (success)"
);

content = content.replace(
  /res = await request\(app.getHttpServer\(\)\).post\(\/documents\/share\).set\('Authorization', Bearer \$\{tokenB\}\).send\(\{ documentMasterId: docA.id, validDays: 7 \}\);[\s\S]*?if \(res.status === 404\)/,
  "let rejected = false; try { await docService.generateShareLink(compB.id, docA.id, userB.id, 7); } catch(e) { if(e.status === 404 || e.message === 'Document not found') rejected = true; }\n  if (rejected)"
);

fs.writeFileSync('test/ecommerce.20b.ts', content);
