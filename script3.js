const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const hookStr = `
  useEffect(() => {
    const syncWarehouse = () => {
      const stored = localStorage.getItem('active_warehouse');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setWarehouse(parsed && parsed.id ? parsed.id : 'all');
        } catch(e) {}
      } else {
        setWarehouse('all');
      }
    };
    syncWarehouse(); // initial
    window.addEventListener('warehouse_changed', syncWarehouse);
    return () => window.removeEventListener('warehouse_changed', syncWarehouse);
  }, []);
`;

content = content.replace('const [warehouse, setWarehouse] = useState("all")', 'const [warehouse, setWarehouse] = useState("all")\n' + hookStr);
fs.writeFileSync('frontend/src/app/page.tsx', content);
