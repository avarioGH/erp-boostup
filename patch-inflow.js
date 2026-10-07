const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/reports/inflow/page.tsx', 'utf8');

s = s.replace(
  /useEffect\(\(\) => \{ fetchData\(\) \}, \[\]\)/,
  `useEffect(() => {
    fetchData();
    const handleWhChange = () => fetchData();
    window.addEventListener('warehouse-changed', handleWhChange);
    return () => window.removeEventListener('warehouse-changed', handleWhChange);
  }, [])`
);

fs.writeFileSync('frontend/src/app/reports/inflow/page.tsx', s);
console.log('Fixed inflow report');
