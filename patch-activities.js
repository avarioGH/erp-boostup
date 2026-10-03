const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/crm/customers/[id]/page.tsx', 'utf8');

const stateInjectionPoint = "const [isPaying, setIsPaying] = useState(false);";
const newStates = `const [isPaying, setIsPaying] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [actType, setActType] = useState('NOTE');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [isSavingAct, setIsSavingAct] = useState(false);

  const handleSaveActivity = async () => {
    if (!actTitle) return alert('Judul aktivitas wajib diisi');
    setIsSavingAct(true);
    try {
      await CRMAPI.createActivity({
        customer_id: customerId,
        type: actType,
        title: actTitle,
        description: actDesc,
      });
      alert('Aktivitas berhasil dicatat!');
      setActivityModalOpen(false);
      setActTitle('');
      setActDesc('');
      
      const res = await CRMAPI.getCustomer360(customerId);
      setData(res);
    } catch(err: any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingAct(false);
    }
  };`;
content = content.replace(stateInjectionPoint, newStates);

const modalInjection = `<Dialog open={payModalOpen}`;
const actModal = `
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Aktivitas Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipe Aktivitas</Label>
              <Select value={actType} onValueChange={setActType}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Catatan (Note)</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="CALL">Panggilan Telepon</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={actTitle} onChange={e => setActTitle(e.target.value)} placeholder="Contoh: Follow up penawaran" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi / Hasil Catatan</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                value={actDesc} 
                onChange={e => setActDesc(e.target.value)} 
                placeholder="Tuliskan detail aktivitas di sini..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveActivity} disabled={isSavingAct || !actTitle}>{isSavingAct ? 'Menyimpan...' : 'Simpan Aktivitas'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={payModalOpen}`;
content = content.replace(modalInjection, actModal);

// Replace button onClick actions
const btn1 = `onClick={() => alert("Fitur Penawaran Segera Hadir")}`;
const newBtn1 = `onClick={() => router.push('/sales/quotations/create?customer_id=' + customerId)}`;
content = content.replace(btn1, newBtn1);

const btn2 = `className="bg-indigo-500 hover:bg-indigo-600"><Activity className="w-4 h-4 mr-2"/> Catat Aktivitas`;
const newBtn2 = `className="bg-indigo-500 hover:bg-indigo-600" onClick={() => setActivityModalOpen(true)}><Activity className="w-4 h-4 mr-2"/> Catat Aktivitas`;
content = content.replace(btn2, newBtn2);

fs.writeFileSync('frontend/src/app/crm/customers/[id]/page.tsx', content);
