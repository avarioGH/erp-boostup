const fs = require('fs');
let code = fs.readFileSync('backend/src/main.ts', 'utf8');

if (!code.includes('ValidationPipe')) {
  code = "import { ValidationPipe } from '@nestjs/common';\n" + code;
  code = code.replace(
    "await app.listen(process.env.PORT ?? 3000);",
    "app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));\n  await app.listen(process.env.PORT ?? 3000);"
  );
  fs.writeFileSync('backend/src/main.ts', code);
}
