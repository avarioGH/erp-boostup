const fs = require('fs');
let c = fs.readFileSync('backend/src/crm/customer.controller.ts', 'utf8');

c = c.replace(
  /@Query\('search'\) search\?: string,\s*\) \{/,
  `@Query('search') search?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {`
);

fs.writeFileSync('backend/src/crm/customer.controller.ts', c);
console.log('Fixed controller signature');
