const fs = require('fs');
let c = fs.readFileSync('backend/src/main.ts', 'utf8');

c = c.replace(
  /const allowedOrigin = process\.env\.CORS_ORIGIN \|\| 'http:\/\/localhost:3000';\s+app\.enableCors\(\{\s+origin: allowedOrigin,/g,
  `app.enableCors({
    origin: true, // Allow all origins dynamically (fixes CORS error on production)`
);

fs.writeFileSync('backend/src/main.ts', c);
console.log('Fixed CORS');
