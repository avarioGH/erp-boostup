const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace('notes String?\n  quantity Float?\n  created_at DateTime', 'notes String?\n  created_at DateTime');
code = code.replace('notes String?\n    quantity Float?\n    created_at DateTime', 'notes String?\n    created_at DateTime');

fs.writeFileSync('prisma/schema.prisma', code, 'utf8');
