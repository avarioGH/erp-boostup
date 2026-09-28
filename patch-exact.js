const fs = require('fs');

const path = 'backend/src/inventory/raw-log.service.ts';
let code = fs.readFileSync(path, 'utf8');

const s1 = `        speciesId: data.speciesId || null,
        sourceId: data.sourceId || null,
        quantity: 1,`;
const r1 = `        ...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),
        ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),
        quantity: 1,`;
code = code.replace(s1, r1);

const s2 = `        locationId: data.locationId || null,
        notes: data.notes`;
const r2 = `        ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),
        notes: data.notes`;
code = code.replace(s2, r2);

const s3 = `            batch: data.batch,
            locationId: data.locationId || null,
            receivingDate: data.receivingDate ? new Date(data.receivingDate) : new Date(),`;
const r3 = `            batch: data.batch,
            ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),
            ...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),
            ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),
            receivingDate: data.receivingDate ? new Date(data.receivingDate) : new Date(),`;
code = code.replace(s3, r3);

const s4 = `        speciesId: data.speciesId !== undefined ? data.speciesId : (existingLog as any).speciesId,
        sourceId: data.sourceId !== undefined ? data.sourceId : (existingLog as any).sourceId,
        originalLength: length,`;
const r4 = `        ...(data.speciesId ? { timberSpecies: { connect: { id: data.speciesId } } } : {}),
        ...(data.sourceId ? { timberSource: { connect: { id: data.sourceId } } } : {}),
        originalLength: length,`;
code = code.replace(s4, r4);

const s5 = `        batch: data.batch || existingLog.batch,
        locationId: data.locationId !== undefined ? data.locationId : existingLog.locationId,
      }
    });`;
const r5 = `        batch: data.batch || existingLog.batch,
        ...(data.locationId ? { location: { connect: { id: data.locationId } } } : {}),
      }
    });`;
code = code.replace(s5, r5);

fs.writeFileSync(path, code);
console.log("Safely patched local raw-log.service.ts using exact string replace");
