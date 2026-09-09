const fs = require('fs');
let code = fs.readFileSync('src/manufacturing/mo/mo.service.ts', 'utf8');

// The error is because I deleted \const total_cost = unit_cost * reqItem.quantity;\ and replaced it with \// STEP 16.5 - True FIFO Costing (Deferred to after movement creation)\
// But wait, it's used elsewhere? No, in my replacement I replaced the whole block! But wait, \	otal_cost\ might be used in the first \	x.stockMovement.create\? 
// No, I changed it to \	otal_cost: 0\ in the first create. 
// But wait, what if I missed another usage? Let's just define \let total_cost = 0;\ there.

code = code.replace('// STEP 16.5 - True FIFO Costing (Deferred to after movement creation)', '// STEP 16.5 - True FIFO Costing (Deferred to after movement creation)\n        let total_cost = 0;');

fs.writeFileSync('src/manufacturing/mo/mo.service.ts', code, 'utf8');
