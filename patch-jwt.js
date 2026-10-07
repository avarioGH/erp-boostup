const fs = require('fs');
let code = fs.readFileSync('backend/src/auth/jwt.strategy.ts', 'utf8');

if (!code.includes('ExtractJwt.fromUrlQueryParameter')) {
  code = code.replace(
    'jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),',
    `jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token')
      ]),`
  );
  fs.writeFileSync('backend/src/auth/jwt.strategy.ts', code);
  console.log('patched jwt strategy to allow token from query parameter');
}
