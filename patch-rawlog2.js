const fs = require('fs');

const path = 'backend/src/inventory/raw-log.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/speciesId: data\\.speciesId !== undefined \\? data\\.speciesId : \\(existingLog as any\\)\\.speciesId,/, 
  "...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),");

code = code.replace(/sourceId: data\\.sourceId !== undefined \\? data\\.sourceId : \\(existingLog as any\\)\\.sourceId,/, 
  "...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),");

code = code.replace(/locationId: data\\.locationId !== undefined \\? data\\.locationId : existingLog\\.locationId,/, 
  "...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),");

// Also in createBulkRawLogs:
code = code.replace(/batch: data\\.batch,\\s*locationId: data\\.locationId \\|\\| null,/g, 
  "batch: data.batch,\\n            ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),\\n            ...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),\\n            ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),");

fs.writeFileSync(path, code);
console.log("RawLogService updated.");
