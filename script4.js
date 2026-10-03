const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

content = content.replace(
  '<Select value={warehouse} onValueChange={(val) => setWarehouse(val as string)}>',
  '<div className="hidden"><Select value={warehouse} onValueChange={(val) => setWarehouse(val as string)}>'
);

content = content.replace(
  '</SelectContent>\n          </Select>\n        </div>',
  '</SelectContent>\n          </Select></div>\n        </div>'
);

fs.writeFileSync('frontend/src/app/page.tsx', content);
