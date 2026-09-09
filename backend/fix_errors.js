const fs = require('fs');

// Fix integration-log.service.ts
let logSvc = fs.readFileSync('src/integrations/integration-log.service.ts', 'utf8');
logSvc = logSvc.replace('module: \\'INTEGRATION\\',', '');
logSvc = logSvc.replace('entity_type: \\'INTEGRATION\\',', 'entity: \\'INTEGRATION\\',');
fs.writeFileSync('src/integrations/integration-log.service.ts', logSvc, 'utf8');

// Fix integrations.controller.ts
let ctrl = fs.readFileSync('src/integrations/integrations.controller.ts', 'utf8');
ctrl = ctrl.replace(/import { PermissionsGuard.*\\n/, '');
ctrl = ctrl.replace(/import { Permissions }.*\\n/, '');
ctrl = ctrl.replace(/@UseGuards\\(JwtAuthGuard, PermissionsGuard\\)/g, '@UseGuards(JwtAuthGuard)');
ctrl = ctrl.replace(/@Permissions\\([^)]+\\)\\n/g, '');
fs.writeFileSync('src/integrations/integrations.controller.ts', ctrl, 'utf8');
