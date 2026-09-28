const fs = require('fs');

const path = 'backend/src/inventory/raw-log.service.ts';
let code = fs.readFileSync(path, 'utf8');

// In createRawLog
code = code.replace(
  /speciesId: data\\.speciesId \\|\\| null,\\s*sourceId: data\\.sourceId \\|\\| null,/g,
  "...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),\\n        ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),"
);
code = code.replace(
  /receivingDate: data\\.receivingDate \\? new Date\\(data\\.receivingDate\\) : new Date\\(\\),\\s*locationId: data\\.locationId \\|\\| null,/g,
  "receivingDate: data.receivingDate ? new Date(data.receivingDate) : new Date(),\\n        ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),"
);

// In createBulkRawLogs
code = code.replace(
  /batch: data\\.batch,\\s*locationId: data\\.locationId \\|\\| null,/g,
  "batch: data.batch,\\n            ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),\\n            ...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),\\n            ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),"
);

// In updateRawLog
code = code.replace(
  /speciesId: data\\.speciesId !== undefined \\? data\\.speciesId : \\(existingLog as any\\)\\.speciesId,\\s*sourceId: data\\.sourceId !== undefined \\? data\\.sourceId : \\(existingLog as any\\)\\.sourceId,/g,
  "...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),\\n        ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),"
);
code = code.replace(
  /batch: data\\.batch \\|\\| existingLog\\.batch,\\s*locationId: data\\.locationId !== undefined \\? data\\.locationId : existingLog\\.locationId,/g,
  "batch: data.batch || existingLog.batch,\\n        ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),"
);

fs.writeFileSync(path, code);
console.log("Safely patched raw-log.service.ts");
