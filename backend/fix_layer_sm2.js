const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

code = code.replace(/layer_date: new Date\('2024-01-01'\) \}\}\);/g, "layer_date: new Date('2024-01-01'), source_movement_id: '600000000000000000000501' }});");
code = code.replace(/layer_date: new Date\('2024-01-02'\) \}\}\);/g, "layer_date: new Date('2024-01-02'), source_movement_id: '600000000000000000000502' }});");

fs.writeFileSync('test/final.certification.ts', code);
