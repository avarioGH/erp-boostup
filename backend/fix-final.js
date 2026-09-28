const fs = require('fs');

function replaceFile(file, from, to) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(from, to);
  fs.writeFileSync(file, content);
}

replaceFile('src/inventory/input-log.service.ts',
  /async listInputLogs\(params: \{/,
  "async listInputLogs(params: { companyId: string; ");
replaceFile('src/inventory/input-log.service.ts',
  /const \{ skip = 0, take = 50, search, status, locationId \} = params;\n\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, status, locationId, companyId } = params;\n    const where: any = { location: { company_id: companyId } };");
replaceFile('src/inventory/input-log.service.ts',
  /async getInputLog\(id: string\) \{/,
  "async getInputLog(id: string, companyId: string) {");
replaceFile('src/inventory/input-log.service.ts',
  /where: \{ id \},/,
  "where: { id, location: { company_id: companyId } },");

replaceFile('src/inventory/sawn-timber.service.ts',
  /async listOutputs\(params: \{/,
  "async listOutputs(params: { companyId: string; ");
replaceFile('src/inventory/sawn-timber.service.ts',
  /const \{ skip = 0, take = 50, search, status, locationId, startDate, endDate \} = params;\n\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, status, locationId, startDate, endDate, companyId } = params;\n    const where: any = { location: { company_id: companyId } };");
replaceFile('src/inventory/sawn-timber.service.ts',
  /async listStock\(params: \{/,
  "async listStock(params: { companyId: string; ");
replaceFile('src/inventory/sawn-timber.service.ts',
  /const \{ skip = 0, take = 50, search, locationId, batch, species \} = params;\n\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, locationId, batch, species, companyId } = params;\n    const where: any = { location: { company_id: companyId } };");
replaceFile('src/inventory/sawn-timber.service.ts',
  /async getOutput\(id: string\) \{/,
  "async getOutput(id: string, companyId: string) {");
replaceFile('src/inventory/sawn-timber.service.ts',
  /where: \{ id \},/,
  "where: { id, location: { company_id: companyId } },");

replaceFile('src/inventory/trimmed-log.service.ts',
  /async listTrimmedLogs\(params: \{/,
  "async listTrimmedLogs(params: { companyId: string; ");
replaceFile('src/inventory/trimmed-log.service.ts',
  /const \{ skip = 0, take = 50, search, status \} = params;\n\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, status, companyId } = params;\n    const where: any = { location: { company_id: companyId } };");
replaceFile('src/inventory/trimmed-log.service.ts',
  /async getTrimmedLog\(id: string\) \{/,
  "async getTrimmedLog(id: string, companyId: string) {");
replaceFile('src/inventory/trimmed-log.service.ts',
  /where: \{ id \},/,
  "where: { id, location: { company_id: companyId } },");

replaceFile('src/inventory/raw-log.service.ts',
  /async listRawLogs\(params: \{/,
  "async listRawLogs(params: { companyId: string; ");
replaceFile('src/inventory/raw-log.service.ts',
  /const \{ skip = 0, take = 50, search, species, diameterClass, locationId, status \} = params;\n\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, species, diameterClass, locationId, status, companyId } = params;\n    const where: any = { location: { company_id: companyId } };");
replaceFile('src/inventory/raw-log.service.ts',
  /async getRawLog\(id: string\) \{/,
  "async getRawLog(id: string, companyId: string) {");
replaceFile('src/inventory/raw-log.service.ts',
  /where: \{ id \},/,
  "where: { id, location: { company_id: companyId } },");
