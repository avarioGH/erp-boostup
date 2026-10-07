const fs = require('fs');
let s = fs.readFileSync('backend/src/auth/jwt.strategy.ts', 'utf8');

s = s.replace(
  /let token = null;/,
  `let token: string | null = null;`
);

fs.writeFileSync('backend/src/auth/jwt.strategy.ts', s);
console.log('Fixed typescript error');
