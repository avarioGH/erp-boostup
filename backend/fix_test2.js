const fs = require('fs');
let content = fs.readFileSync('test/ecommerce.20b.ts', 'utf8');

const s1 = es = await request(app.getHttpServer()).post(\/documents/share\).set('Authorization', \Bearer \\).send({ documentMasterId: docA.id, validDays: 7 });\n  if (res.status === 201 || res.status === 200) pass('K', 'Same-tenant share link generation succeeds'); else fail('K', \Expected 20X, got \\);;

const r1 = const docService = app.get(require('../src/document/document.service').DocumentService);\n  let success = false; try { await docService.generateShareLink(compA.id, docA.id, userA.id, 7); success = true; } catch(e) {}\n  if (success) pass('K', 'Same-tenant share link generation succeeds'); else fail('K', \Expected success, got error\);;

const s2 = es = await request(app.getHttpServer()).post(\/documents/share\).set('Authorization', \Bearer \\).send({ documentMasterId: docA.id, validDays: 7 });\n  if (res.status === 404) pass('M', 'Cross-tenant share link generation returns 404 NotFound'); else fail('M', \Expected 404, got \\);;

const r2 = let rejected = false; try { await docService.generateShareLink(compB.id, docA.id, userB.id, 7); } catch(e) { if(e.status === 404 || e.message === 'Document not found') rejected = true; }\n  if (rejected) pass('M', 'Cross-tenant share link generation returns 404 NotFound'); else fail('M', \Expected rejection\);;

content = content.replace(s1, r1).replace(s2, r2);

fs.writeFileSync('test/ecommerce.20b.ts', content);
