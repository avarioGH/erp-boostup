const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

function addFieldToModel(modelName, fieldDefinition) {
  const marker = "model " + modelName + " {";
  if (code.includes(marker) && !code.includes(fieldDefinition)) {
    code = code.replace(marker, marker + "\n  " + fieldDefinition);
  }
}

addFieldToModel('Company', 'attachments Attachment[]');
addFieldToModel('Company', 'notifications Notification[]');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
