const fs = require('fs');
const path = 'src/inventory/inventory.service.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const chamber = await this\.prisma\.chamber\.count[^]*?terlebih dahulu\.'\);/, '');

fs.writeFileSync(path, content, 'utf8');
