const fs = require('fs');

function fixNeverArray(filePath, regexStr, replacement) {
  try {
    let code = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(regexStr, 'g');
    if (regex.test(code)) {
      code = code.replace(regex, replacement);
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Fixed:', filePath);
    }
  } catch (e) {
    console.error('Failed to fix:', filePath, e.message);
  }
}

// Fix mrp.service.ts
fixNeverArray('backend/src/mrp/mrp.service.ts', 'const mrpResults = \\[\\];', 'const mrpResults: any[] = [];');
fixNeverArray('backend/src/mrp/mrp.service.ts', 'const shortageAlerts = \\[\\];', 'const shortageAlerts: any[] = [];');

// Fix scheduling.service.ts
fixNeverArray('backend/src/manufacturing/scheduling/scheduling.service.ts', 'const scheduledWorkOrders = \\[\\];', 'const scheduledWorkOrders: any[] = [];');

// Fix mo.service.ts
fixNeverArray('backend/src/manufacturing/mo/mo.service.ts', 'const availability = \\[\\];', 'const availability: any[] = [];');

// Fix maintenance.service.ts
fixNeverArray('backend/src/maintenance/maintenance.service.ts', 'const dueMaintenance = \\[\\];', 'const dueMaintenance: any[] = [];');

