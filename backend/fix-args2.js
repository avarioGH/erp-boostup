const fs = require('fs');

function replace(file, from, to) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(from, to);
  fs.writeFileSync(file, content);
}

replace('src/inventory/input-log.service.ts', /async getAvailableTrimmedLogs\(\) \{/, "async getAvailableTrimmedLogs(companyId?: string) {");
replace('src/inventory/input-log.service.ts', /async cancelInputLog\(id: string\) \{/, "async cancelInputLog(id: string, companyId?: string) {");

replace('src/inventory/raw-log.service.ts', /async cancelRawLog\(id: string\) \{/, "async cancelRawLog(id: string, companyId?: string) {");
replace('src/inventory/raw-log.service.ts', /async deleteRawLog\(id: string\) \{/, "async deleteRawLog(id: string, companyId?: string) {");
replace('src/inventory/raw-log.service.ts', /const log = await this.getRawLog\(id\);/, "const log = await this.getRawLog(id, companyId || '');");

replace('src/inventory/sawn-timber.service.ts', /async postOutput\(id: string\) \{/, "async postOutput(id: string, companyId?: string) {");
replace('src/inventory/sawn-timber.service.ts', /async cancelOutput\(id: string\) \{/, "async cancelOutput(id: string, companyId?: string) {");

replace('src/inventory/trimmed-log.service.ts', /async getChildrenByRawLog\(rawLogId: string\) \{/, "async getChildrenByRawLog(rawLogId: string, companyId?: string) {");
replace('src/inventory/trimmed-log.service.ts', /async cancelTrimmedLog\(id: string\) \{/, "async cancelTrimmedLog(id: string, companyId?: string) {");
replace('src/inventory/trimmed-log.service.ts', /const log = await this.getTrimmedLog\(id\);/, "const log = await this.getTrimmedLog(id, companyId || '');");

