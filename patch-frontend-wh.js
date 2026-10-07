const fs = require('fs');

function patchFrontend(file, fetchFn) {
  let s = fs.readFileSync(file, 'utf8');
  
  const searchStr = `useEffect(() => {
    ${fetchFn}()
  }, [])`;
  
  const replaceStr = `useEffect(() => {
    ${fetchFn}();
    const handleWhChange = () => {
      ${fetchFn}();
    };
    window.addEventListener('warehouse-changed', handleWhChange);
    return () => window.removeEventListener('warehouse-changed', handleWhChange);
  }, [])`;
  
  if (s.includes(searchStr)) {
    s = s.replace(searchStr, replaceStr);
  } else {
    // try matching a looser pattern
    const regex = new RegExp(`useEffect\\(\\(\\)\\s*=>\\s*\\{\\s*${fetchFn}\\(\\)\\s*\\},\\s*\\[\\]\\)`);
    s = s.replace(regex, replaceStr);
  }
  
  fs.writeFileSync(file, s);
}

patchFrontend('frontend/src/app/reports/stock/page.tsx', 'fetchStocks');
patchFrontend('frontend/src/app/reports/inflow/page.tsx', 'fetchReport');

console.log('Patched frontend event listeners');
