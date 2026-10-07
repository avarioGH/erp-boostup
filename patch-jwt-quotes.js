const fs = require('fs');
let s = fs.readFileSync('backend/src/auth/jwt.strategy.ts', 'utf8');

s = s.replace(
  /ExtractJwt\.fromUrlQueryParameter\('token'\)/,
  `(req: any) => {
          let token = null;
          if (req && req.query && req.query.token) {
            token = req.query.token;
          } else if (req && req.headers && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
              token = parts[1];
            }
          }
          if (typeof token === 'string') {
            token = token.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
          }
          return token;
        }`
);
fs.writeFileSync('backend/src/auth/jwt.strategy.ts', s);
console.log('Patched jwt strategy');
