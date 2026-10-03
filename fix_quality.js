const fs = require("fs");
let content = fs.readFileSync("backend/src/manufacturing/quality/quality.service.ts", "utf8");

content = content.replace(/quality_point: true,/g, "");
content = content.replace(/inspector: true,/g, "");

fs.writeFileSync("backend/src/manufacturing/quality/quality.service.ts", content);

