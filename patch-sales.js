const fs = require('fs');
const path = '/root/erp-boostup/backend/src/sales/timber-sales.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const imports = 'import { UseGuards } from "@nestjs/common";\nimport { JwtAuthGuard } from "../auth/jwt-auth.guard";\nimport { PermissionsGuard } from "../auth/permissions.guard";\nimport { Permissions } from "../auth/permissions.decorator";\n';

code = code.replace('import { Controller', imports + 'import { Controller');

code = code.replace('@Controller("sales/timber")', '@UseGuards(JwtAuthGuard, PermissionsGuard)\n@Controller("sales/timber")');

code = code.replace('@Post("orders")', '@Permissions("sales.order.create")\n  @Post("orders")');
code = code.replace('@Get("orders")', '@Permissions("sales.order.view")\n  @Get("orders")');
code = code.replace('@Get("orders/:id")', '@Permissions("sales.order.view")\n  @Get("orders/:id")');
code = code.replace('@Post("orders/:id/confirm")', '@Permissions("sales.order.confirm")\n  @Post("orders/:id/confirm")');
code = code.replace('@Post("orders/:id/cancel")', '@Permissions("sales.order.cancel")\n  @Post("orders/:id/cancel")');
code = code.replace('@Post("orders/:id/deliveries")', '@Permissions("sales.delivery.create")\n  @Post("orders/:id/deliveries")');
code = code.replace('@Get("orders/:id/realization")', '@Permissions("sales.order.view")\n  @Get("orders/:id/realization")');
code = code.replace('@Post("delivery/:id/post")', '@Permissions("sales.delivery.post")\n  @Post("delivery/:id/post")');
code = code.replace('@Post("delivery/:id/cancel")', '@Permissions("sales.delivery.cancel")\n  @Post("delivery/:id/cancel")');

fs.writeFileSync(path, code);
