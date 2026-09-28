const fs = require('fs');

function fixInputLog() {
  let file = 'src/inventory/input-log.service.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \{ skip = 0, take = 50, search, status, locationId, companyId \} = params;\s+/, 
    "const { skip = 0, take = 50, search, status, locationId, companyId } = params;\n    const where: any = { location: { company_id: companyId } };\n");
  fs.writeFileSync(file, content);
}

function fixSawnTimber() {
  let file = 'src/inventory/sawn-timber.service.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \{ skip = 0, take = 50, search, status, locationId, startDate, endDate, companyId \} = params;\s+/, 
    "const { skip = 0, take = 50, search, status, locationId, startDate, endDate, companyId } = params;\n    const where: any = { location: { company_id: companyId } };\n");
  content = content.replace(/const \{ skip = 0, take = 50, search, locationId, batch, species, companyId \} = params;\s+/, 
    "const { skip = 0, take = 50, search, locationId, batch, species, companyId } = params;\n    const where: any = { location: { company_id: companyId } };\n");
  fs.writeFileSync(file, content);
}

function fixTrimmedLog() {
  let file = 'src/inventory/trimmed-log.service.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \{ skip = 0, take = 50, search, status, companyId \} = params;\s+/, 
    "const { skip = 0, take = 50, search, status, companyId } = params;\n    const where: any = { location: { company_id: companyId } };\n");
  fs.writeFileSync(file, content);
}

function fixRawLog() {
  let file = 'src/inventory/raw-log.service.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \{ skip = 0, take = 50, search, species, diameterClass, locationId, status, companyId \} = params;\s+/, 
    "const { skip = 0, take = 50, search, species, diameterClass, locationId, status, companyId } = params;\n    const where: any = { location: { company_id: companyId } };\n");
  // Also fix missing companyId in getRawLog calls
  content = content.replace(/const log = await this\.getRawLog\(id\);/g, "const log = await this.getRawLog(id, companyId || '');");
  content = content.replace(/const existingLog = await this\.prisma\.rawLog\.findUnique\(\{ where: \{ id \} \}\);/g, "const existingLog = await this.getRawLog(id, companyId || '');");
  fs.writeFileSync(file, content);
}

fixInputLog();
fixSawnTimber();
fixTrimmedLog();
fixRawLog();
