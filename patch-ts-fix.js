const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

c = c.replace(
  "const crm = { activeOpportunities: opportunities?.length || 0 };",
  "const crm = { activeOpportunities: opportunities?.length || 0, activities: activities?.today || [] };\n  const quotations = data.quotations || [];\n  const deliveries = data.deliveries || [];"
);

c = c.replace(
  "...crm.activities.map",
  "...(activities?.today || activities || []).map"
);
c = c.replace(
  "...sales.quotations.map",
  "...quotations.map"
);
c = c.replace(
  "...sales.deliveries.map",
  "...deliveries.map"
);

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
