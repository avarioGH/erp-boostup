const fs = require("fs");
let code = fs.readFileSync("frontend/src/lib/api.ts", "utf8");

code = code.replace(/export const DashboardAPI =/g, "export const DashboardAPI: any =");
code = code.replace(/export const InventoryAPI =/g, "export const InventoryAPI: any =");
code = code.replace(/export const B2BApi =/g, "export const B2BApi: any =");
code = code.replace(/export const PurchasingAPI =/g, "export const PurchasingAPI: any =");
code = code.replace(/export const VendorAPI =/g, "export const VendorAPI: any =");
code = code.replace(/export const AuthAPI =/g, "export const AuthAPI: any =");
code = code.replace(/export const CompanyAPI =/g, "export const CompanyAPI: any =");
code = code.replace(/export const UserAPI =/g, "export const UserAPI: any =");
code = code.replace(/export const CRMAPI =/g, "export const CRMAPI: any =");
code = code.replace(/export const PosAPI =/g, "export const PosAPI: any =");
code = code.replace(/export const FinanceAPI =/g, "export const FinanceAPI: any =");

fs.writeFileSync("frontend/src/lib/api.ts", code);
