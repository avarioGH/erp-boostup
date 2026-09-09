const fs = require("fs");
let apiCode = fs.readFileSync("src/lib/api.ts", "utf8");
apiCode = apiCode.replace("const api = axios.create", "export const api = axios.create");
fs.writeFileSync("src/lib/api.ts", apiCode);
