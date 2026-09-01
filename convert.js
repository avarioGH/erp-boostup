const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Change provider
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "mongodb"');

// 2. Change IDs
schema = schema.replace(/id\s+String\s+@id\s+@default\(uuid\(\)\)/g, 'ID_PLACEHOLDER');
schema = schema.replace(/id\s+String\s+@id/g, 'ID_PLACEHOLDER');
schema = schema.replace(/ID_PLACEHOLDER/g, 'id String @id @default(auto()) @map("_id") @db.ObjectId');

// 3. Remove SQL specific DB types and Decimal
schema = schema.replace(/@db\.Text/g, '');
schema = schema.replace(/@db\.VarChar\(\d+\)/g, '');
schema = schema.replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '');
schema = schema.replace(/@db\.Uuid/g, '');
schema = schema.replace(/Decimal/g, 'Float');

// 4. Change foreign keys to @db.ObjectId
const relationRegex = /@relation\([^)]*fields:\s*\[([^\]]+)\]/g;
const fks = new Set();
let match;
while ((match = relationRegex.exec(schema)) !== null) {
  const fields = match[1].split(',').map(f => f.trim());
  fields.forEach(f => fks.add(f.replace(/['"]/g, '')));
}

const lines = schema.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  const fieldDefRegex = /^\s*([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)(\??)(\s*.*)$/;
  const m = line.match(fieldDefRegex);
  if (m) {
    const fieldName = m[1];
    const typeName = m[2];
    const optional = m[3];
    
    if (fks.has(fieldName) && typeName === 'String' && !line.includes('@db.ObjectId')) {
      lines[i] = line.replace(typeName + optional, typeName + optional + ' @db.ObjectId');
    }
  }
}
schema = lines.join('\n');

// 5. Add onDelete: NoAction, onUpdate: NoAction ONLY if it defines fields
schema = schema.replace(/@relation\(([^)]+)\)/g, (match, inner) => {
  if (!inner.includes('fields:')) return match; // Skip back-relations

  let newInner = inner;
  if (!newInner.includes('onDelete')) {
    newInner += ', onDelete: NoAction';
  } else {
    newInner = newInner.replace(/onDelete:\s*[a-zA-Z]+/, 'onDelete: NoAction');
  }
  
  if (!newInner.includes('onUpdate')) {
    newInner += ', onUpdate: NoAction';
  } else {
    newInner = newInner.replace(/onUpdate:\s*[a-zA-Z]+/, 'onUpdate: NoAction');
  }
  
  return `@relation(${newInner})`;
});

// 6. Fix multi-field IDs (@@id)
schema = schema.replace(/@@id\([^)]+\)/g, '');

// 7. JSONB to Json
schema = schema.replace(/JSONB/gi, 'Json');

fs.writeFileSync(schemaPath, schema);
console.log('Schema converted to MongoDB!');
