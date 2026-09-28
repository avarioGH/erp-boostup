const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const js = `
const fs = require('fs');
const path = 'src/app/inventory/logs/create/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add state for sources
code = code.replace(/const \\[speciesList, setSpeciesList\\] = useState<any\\[\\]>\\(\\[\\]\\)/, "const [speciesList, setSpeciesList] = useState<any[]>([]);\\n  const [sources, setSources] = useState<any[]>([]);");

// Add to masterForm
code = code.replace(/speciesId: "",/, "speciesId: \\"\\",\\n    sourceId: \\"\\",");

// Add to Promise.all
code = code.replace(/InventoryAPI\\.getWarehouses\\(\\),\\n\\s*MasterDataAPI\\.getSpecies\\(\\)/, "InventoryAPI.getWarehouses(),\\n      MasterDataAPI.getSpecies(),\\n      MasterDataAPI.getSources()");

// Update Promise.then
code = code.replace(/\\.then\\(\\[wRes, sRes\\]: any\\) => \\{/, ".then(([wRes, sRes, srcRes]: any) => {\\n        setSources(Array.isArray(srcRes) ? srcRes : [])");

// Update payload mapping
code = code.replace(/speciesId: masterForm\\.speciesId,/, "speciesId: masterForm.speciesId,\\n        sourceId: masterForm.sourceId || null,");

// Update validation
code = code.replace(/if \\(!masterForm\\.speciesId\\) \\{/, "if (!masterForm.sourceId) { return toast({ title: \\"Validasi Gagal\\", description: \\"Supplier harus dipilih\\", variant: \\"destructive\\" }) }\\n    if (!masterForm.speciesId) {");

// Update UI (grid-cols-4 to grid-cols-5)
code = code.replace(/grid-cols-1 md:grid-cols-4/, "grid-cols-1 md:grid-cols-5");

// Add Source UI Select
const sourceUI = \`
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier *</label>
            <Select value={masterForm.sourceId} onValueChange={v => setMasterForm({...masterForm, sourceId: v || ''})}>
              <SelectTrigger>
                {masterForm.sourceId ? sources.find(s => s.id === masterForm.sourceId)?.name : <SelectValue placeholder="Pilih Supplier..."/>}
              </SelectTrigger>
              <SelectContent>
                {sources.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
\`;

code = code.replace(/<div className="space-y-2">\\s*<label className="text-sm font-medium">Warehouse \\*<\\/label>/, sourceUI + '\\n          <div className="space-y-2">\\n            <label className="text-sm font-medium">Warehouse *</label>');

fs.writeFileSync(path, code);
console.log("Create Log UI patched with Supplier!");
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/frontend || exit 1
    cat << 'EOF' > patch-supplier.js
${js}
EOF
    node patch-supplier.js
    npm run build
    pm2 restart erp-frontend
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
