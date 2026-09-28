const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');

// We need to reorder the operations!
// Find the operations and restructure them:
// Currently: 
// adj post
// adj cancel
// trf post
// trf cancel
// prd post
// prd cancel

code = code.replace("await req('/inventory/adjustments/' + adj.id + '/cancel', 'POST', null, token);\n    R.adj_pos_cancel = 201;", "");
code = code.replace("await req('/inventory/transfers/' + trf.id + '/cancel', 'POST', null, token);\n    R.trf_cancel = 201;", "");
code = code.replace("await req('/inventory/production/' + prd.id + '/cancel', 'PUT', null, token);\n    R.prd_cancel = 200;", "");

const cancellations = 
    console.log('4. Cancellations');
    await req('/inventory/production/' + prd.id + '/cancel', 'PUT', null, token);
    R.prd_cancel = 200;
    await req('/inventory/transfers/' + trf.id + '/cancel', 'POST', null, token);
    R.trf_cancel = 201;
    await req('/inventory/adjustments/' + adj.id + '/cancel', 'POST', null, token);
    R.adj_pos_cancel = 201;
;

code = code.replace("R.success = true;", cancellations + "\n    R.success = true;");

fs.writeFileSync('test-minimal.js', code);
