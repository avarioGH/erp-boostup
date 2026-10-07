const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const [nettingNotes, setNettingNotes] = useState('');",
  "const [nettingNotes, setNettingNotes] = useState('');\n  const [salesSearch, setSalesSearch] = useState('');\n  const [salesStartDate, setSalesStartDate] = useState('');\n  const [salesEndDate, setSalesEndDate] = useState('');"
);

fs.writeFileSync(path, code);
console.log('patched states');
