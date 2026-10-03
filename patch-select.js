const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/inflow/tambah/page.tsx', 'utf8');

// Replace the entire SearchableSelect function
const selectRegex = /function SearchableSelect\(\{.*?\}\) \{[\s\S]*?return \([\s\S]*?\n\}\n/m;
const newSelect = `function SearchableSelect({ options, value, onChange, placeholder, disabled = false, renderLabel }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options?.find((o: any) => o.id === value)
  const displayValue = open ? search : (selectedOption ? selectedOption.name : "")

  const filteredOptions = (options || []).filter((o: any) => 
    (o.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const defaultRenderLabel = (o: any) => \`\${o?.name || 'TANPA NAMA'} \${o?.weight ? '(' + o.weight + 'g)' : ''}\`

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input 
          disabled={disabled}
          value={displayValue}
          onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={selectedOption ? selectedOption.name : (placeholder || \`Pilih... (Total: \${options?.length || 0})\`)}
          className="w-full pr-8 cursor-pointer bg-accent/30"
          readOnly={!open}
        />
        <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
      </div>
      
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border shadow-md rounded-md max-h-60 overflow-y-auto" style={{ display: 'block' }}>
          <div className="p-1 sticky top-0 bg-popover/90 backdrop-blur-sm border-b">
             <Input 
               autoFocus
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder={\`Ketik untuk mencari... (Total: \${options?.length || 0})\`}
               className="h-8 text-sm"
             />
          </div>
          {(!filteredOptions || filteredOptions.length === 0) ? (
            <div className="p-3 text-sm text-center text-red-500 bg-red-100 font-bold border border-red-500">
              Pencarian tidak ditemukan!
            </div>
          ) : (
            filteredOptions.map((o: any, i: number) => (
              <div 
                key={o?.id || i} 
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent text-foreground"
                style={{ minHeight: '36px', display: 'block', borderBottom: '1px solid #333' }}
                onClick={() => { onChange(o?.id); setOpen(false); setSearch(""); }}
              >
                {renderLabel ? renderLabel(o) : defaultRenderLabel(o)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
`;

content = content.replace(selectRegex, newSelect);
fs.writeFileSync('frontend/src/app/inventory/inflow/tambah/page.tsx', content);
