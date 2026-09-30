const fs = require('fs');
let code = fs.readFileSync('src/app/inventory/products/page.tsx', 'utf8');

// 1. Add lucide icons
code = code.replace(/import \{([^}]+)\} from\s*"lucide-react"/g, (match, p1) => {
  if (match.includes('MoreHorizontal')) return match;
  return import {, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
});

// 2. Add DropdownMenuItem
code = code.replace(/DropdownMenuCheckboxItem\s*\} from\s*"@\/components\/ui\/dropdown-menu"/, 'DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu"');

// 3. Add state for editing
if (!code.includes('const [editingId')) {
  code = code.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\)/, 
    'const [isSubmitting, setIsSubmitting] = useState(false)\n  const [editingId, setEditingId] = useState<string | null>(null)');
}

// 4. Update handleDelete
if (!code.includes('handleDelete')) {
  const handleDeleteFunc = 
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await InventoryAPI.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      alert('Produk berhasil dihapus');
    } catch (error: any) {
      console.error('Gagal menghapus produk:', error);
      alert('Gagal menghapus produk: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleEdit = (p: any) => {
    setFormData({
      code: p.sku || '',
      barcode: p.barcode || '',
      name: p.name || '',
      description: p.description || '',
      purchasePrice: p.purchase_price || '',
      sellingPrice: p.price || p.selling_price || '',
      weight: p.weight || '',
      categoryId: p.category_id || '',
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
;
  code = code.replace(/const generateSKU = \(\) => \{/, handleDeleteFunc + '\n  const generateSKU = () => {');
}

// 5. Update form save
code = code.replace(/await InventoryAPI\.createProduct\(payload\)/, 
  'if (editingId) {\n        await InventoryAPI.updateProduct(editingId, payload);\n      } else {\n        await InventoryAPI.createProduct(payload);\n      }');

// 6. Reset editingId on cancel
code = code.replace(/setShowForm\(false\)/g, '() => { setShowForm(false); setEditingId(null); setFormData({code:"", barcode:"", name:"", description:"", purchasePrice:"", sellingPrice:"", weight:"", categoryId:""}); }');
// Wait, the replace above might break if onClick={() => setShowForm(false)}
code = code.replace(/onClick=\{.*?setShowForm\(false\).*?\}/g, 'onClick={() => { setShowForm(false); setEditingId(null); setFormData({code:"", barcode:"", name:"", description:"", purchasePrice:"", sellingPrice:"", weight:"", categoryId:""}); }}');

// 7. Update TableHeader
if (!code.includes('>Aksi<')) {
  code = code.replace(/\{visibleColumns\.totalStock && <TableHead className="text-center font-bold">Total Stok<\/TableHead>\}/,
    '{visibleColumns.totalStock && <TableHead className="text-center font-bold">Total Stok</TableHead>}\n <TableHead className="text-right font-semibold">Aksi</TableHead>');
}

// 8. Update TableBody
if (!code.includes('<MoreHorizontal')) {
  const aksiCol = 
 <TableCell className="text-right">
   <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <Button variant="ghost" className="h-8 w-8 p-0">
         <span className="sr-only">Buka menu</span>
         <MoreHorizontal className="h-4 w-4" />
       </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end">
       <DropdownMenuItem onClick={() => handleEdit(p)} className="cursor-pointer">
         <Edit2 className="mr-2 h-4 w-4 text-indigo-500" /> Edit
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => handleDelete(p.id)} className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50">
         <Trash2 className="mr-2 h-4 w-4" /> Hapus
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
 </TableCell>
;
  code = code.replace(/<\/Badge>\s*<\/TableCell>\s*\)\}\s*<\/TableRow>/g, 
    '</Badge>\n </TableCell>\n )}' + aksiCol + '\n </TableRow>');
}

fs.writeFileSync('src/app/inventory/products/page.tsx', code);
