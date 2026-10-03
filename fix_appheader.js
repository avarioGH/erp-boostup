const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-header.tsx", "utf8");

// Extract the fetch logic into a function
content = content.replace("api.get('/inventory/warehouses').then(res => {\n if (res.data) setWarehouses(res.data)\n }).catch(err => console.error(\"Error fetching warehouses\", err))", 
`const fetchWarehouses = () => {
    api.get('/inventory/warehouses').then(res => {
      if (res.data) setWarehouses(res.data)
    }).catch(err => console.error("Error fetching warehouses", err))
  }
  fetchWarehouses()`);

// Add onOpenChange to DropdownMenu
content = content.replace("<DropdownMenu>", "<DropdownMenu onOpenChange={(open) => { if(open) fetchWarehouses() }}>");

fs.writeFileSync("frontend/src/components/app-header.tsx", content);

