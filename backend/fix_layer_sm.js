const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

const s1 = "unit_cost: 10000, layer_date: new Date('2024-01-01')";
const s2 = "unit_cost: 10000, layer_date: new Date('2024-01-01'), source_movement_id: '600000000000000000000501'";

const s3 = "unit_cost: 12000, layer_date: new Date('2024-01-02')";
const s4 = "unit_cost: 12000, layer_date: new Date('2024-01-02'), source_movement_id: '600000000000000000000502'";

const s5 = "unit_cost: 20000, layer_date: new Date('2024-01-01')";
const s6 = "unit_cost: 20000, layer_date: new Date('2024-01-01'), source_movement_id: '600000000000000000000503'";

code = code.replace(new RegExp(s1, 'g'), s2);
code = code.replace(new RegExp(s3, 'g'), s4);
code = code.replace(new RegExp(s5, 'g'), s6);

fs.writeFileSync('test/final.certification.ts', code);
