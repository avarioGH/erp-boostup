const fs = require('fs');
let content = fs.readFileSync('src/integrations/providers/payment/tripay/tripay.module.ts', 'utf8');
if (!content.includes('GlModule')) {
    content = "import { GlModule } from '../../../../../gl/gl.module';\n" + content;
    content = content.replace("imports: [PrismaModule, PaymentModule]", "imports: [PrismaModule, PaymentModule, GlModule]");
    fs.writeFileSync('src/integrations/providers/payment/tripay/tripay.module.ts', content);
}
