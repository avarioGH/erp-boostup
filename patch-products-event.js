const fs = require('fs');
const path = 'frontend/src/app/inventory/products/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('window.addEventListener("warehouse_changed"')) {
    content = content.replace(
        /useEffect\(\(\) => \{\s*async function fetchData\(\) \{/,
        `useEffect(() => {
    const handleWarehouseChange = () => {
      const storedActive = localStorage.getItem("active_warehouse");
      if (storedActive && storedActive !== "null" && storedActive !== "undefined") {
        setActiveWarehouse(JSON.parse(storedActive));
      } else {
        setActiveWarehouse(null);
      }
    };
    
    // Initial load
    handleWarehouseChange();
    
    window.addEventListener("warehouse_changed", handleWarehouseChange);
    return () => window.removeEventListener("warehouse_changed", handleWarehouseChange);
  }, []);

  useEffect(() => {
   async function fetchData() {`
    );
}

fs.writeFileSync(path, content);
