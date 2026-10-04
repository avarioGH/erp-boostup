const fs = require('fs');

// Fix HR Controller imports
let hrC = fs.readFileSync('backend/src/hr/hr.controller.ts', 'utf8');
hrC = hrC.replace(/import \{ Query, Param, PermissionsGuard \} from '\.\.\/auth\/permissions\.guard';/g, "import { PermissionsGuard } from '../auth/permissions.guard';");
// make sure Query and Param are imported from @nestjs/common
if (!hrC.includes('Query, Param')) {
  hrC = hrC.replace(/import \{/g, 'import { Query, Param,');
}
// Clean up my messy replace:
hrC = hrC.replace(/import \{ Query, Param, Query, Param,/g, "import { Query, Param,");
hrC = hrC.replace(/import \{ Query, Param, Controller/g, "import { Query, Param, Controller");

fs.writeFileSync('backend/src/hr/hr.controller.ts', hrC);

// Fix fish-purchase.service.ts dangling 'sub'
let fpS = fs.readFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', 'utf8');
fpS = fpS.replace(/sub\s+received_qty:/g, 'received_qty:');
fpS = fpS.replace(/sub\s+tax: 0,/g, 'tax: 0,');
fs.writeFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', fpS);

console.log('Fixed backend syntax');
