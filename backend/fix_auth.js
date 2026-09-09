const fs = require('fs');
let content = fs.readFileSync('src/auth/jwt-auth.guard.ts', 'utf8');
content = content.replace(/catch \(e\) \{[\s\S]*?\}/, "catch (e) { throw new UnauthorizedException('Anda belum login'); }");
fs.writeFileSync('src/auth/jwt-auth.guard.ts', content);
