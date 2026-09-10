const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/**/*.ts');
const results = [];

const regex = /(prisma|tx|this\.prisma)\.(warehouseStock|stockMovement|inventoryCostLayer|costLayerConsumption)\.(create|update|updateMany|upsert|delete|deleteMany|findFirst|findUnique)/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
      results.push({
        file: file,
        line: i + 1,
        client: match[1],
        entity: match[2],
        mutation: match[3],
        content: line.trim()
      });
    }
  });
}

console.log(JSON.stringify(results, null, 2));
