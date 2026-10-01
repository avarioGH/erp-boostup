import re
filepath = r"frontend\src\app\inventory\partai\[id]\page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start4 = content.find('<TabsContent value="input">')
start5 = content.find('<TabsContent value="output">')
end5_match = re.search(r'</TabsContent>', content[start5:])
end5 = start5 + end5_match.end()

replacement = """<TabsContent value="input">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>Production Jobs (Input WIP)</CardTitle>
                <CardDescription>Pekerjaan gergajian berjalan yang diambil dari DUKB/Trimmed Log.</CardDescription>
              </div>
              <Button onClick={() => router.push(`/inventory/input-logs/create?partaiId=${id}`)} className="bg-primary">
                <Plus className="w-4 h-4 mr-2" /> Buat WIP Baru
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {(partai.inputLogs || []).map((i: any) => {
                const totalInputVol = Number(i.totalVolume || 0);
                const outItems = (i.sawnOutputs || []).flatMap((o: any) => o.items || []);
                const totalOutputVol = outItems.reduce((acc: number, cur: any) => acc + (cur.volumeM3 || 0), 0);
                const progressPct = totalInputVol > 0 ? Math.min(100, Math.round((totalOutputVol / totalInputVol) * 100)) : 0;
                
                return (
                  <Card key={i.id} className="overflow-hidden border-border/60 hover:border-primary/40 transition-all cursor-pointer shadow-sm group" onClick={() => router.push(`/inventory/input-logs/${i.id}`)}>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-primary group-hover:underline">{i.inputNumber}</span>
                          {i.status === 'DONE' ? <Badge className="bg-emerald-500 hover:bg-emerald-600">DONE</Badge> : i.status === 'IN_PROCESS' ? <Badge className="bg-amber-500 hover:bg-amber-600">IN PROCESS</Badge> : <Badge className="bg-rose-500 hover:bg-rose-600">AVAILABLE</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-1 items-center">
                          <span className="font-medium text-foreground/80">{i.species}</span> &bull; {i.items?.length || 0} Source Logs
                        </div>
                      </div>
                      
                      <div className="md:col-span-7 grid grid-cols-3 gap-4 text-sm text-center">
                        <div className="bg-muted/30 rounded-md p-2">
                          <div className="text-xs text-muted-foreground mb-1">Input (m&sup3;)</div>
                          <div className="font-semibold text-foreground/90">{totalInputVol.toFixed(4)}</div>
                        </div>
                        <div className="bg-muted/30 rounded-md p-2">
                          <div className="text-xs text-muted-foreground mb-1">Output (m&sup3;)</div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">{totalOutputVol.toFixed(4)}</div>
                        </div>
                        <div className="bg-muted/30 rounded-md p-2">
                          <div className="text-xs text-muted-foreground mb-1">Yield</div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">{progressPct}%</div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 flex justify-end">
                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/inventory/input-logs/${i.id}`) }}>
                          Detail Pekerjaan <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                    {/* Progress Bar Visualizer */}
                    <div className="h-1.5 w-full bg-muted/50">
                      <div className={`h-full transition-all duration-500 ${i.status === 'DONE' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progressPct}%` }} />
                    </div>
                  </Card>
                );
              })}
              {(!partai.inputLogs || partai.inputLogs.length === 0) && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  Belum ada pekerjaan produksi (WIP). Klik Buat WIP Baru untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. SAWN TIMBER OUTPUT */}
        <TabsContent value="output">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>Sawn Timber Output (Daily Tally)</CardTitle>
                <CardDescription>Hasil akhir gergajian yang tercatat dari seluruh WIP partai ini.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Tgl Produksi</TableHead>
                    <TableHead>Source WIP</TableHead>
                    <TableHead>Tebal</TableHead>
                    <TableHead>Lebar</TableHead>
                    <TableHead>Panjang</TableHead>
                    <TableHead className="text-right">PCS</TableHead>
                    <TableHead className="text-right">M&sup3;</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partai.sawnOutputs || []).flatMap((o: any) => (o.items || []).map((item: any) => ({ ...item, parentDate: o.outputDate, parentInputId: o.inputLogId }))).map((i: any) => {
                    const wip = (partai.inputLogs || []).find((log: any) => log.id === i.parentInputId);
                    return (
                      <TableRow key={i.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>{i.parentDate ? new Date(i.parentDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                        <TableCell className="font-medium text-primary"><Link href={`/inventory/input-logs/${i.parentInputId}`}>{wip?.inputNumber || "WIP"}</Link></TableCell>
                        <TableCell>{i.thicknessMm / 10} cm</TableCell>
                        <TableCell>{i.widthMm / 10} cm</TableCell>
                        <TableCell>{i.lengthMm / 10} cm</TableCell>
                        <TableCell className="text-right font-medium">{i.quantityPcs}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{i.volumeM3.toFixed(4)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {(!partai.sawnOutputs || partai.sawnOutputs.length === 0 || partai.sawnOutputs.flatMap((o: any) => o.items).length === 0) && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada output produksi.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>"""

new_content = content[:start4] + replacement + content[end5:]

if 'import Link from' not in new_content:
    new_content = new_content.replace('import { useRouter } from "next/navigation";', 'import { useRouter } from "next/navigation";\nimport Link from "next/link";')

if 'ArrowRight' not in new_content:
    new_content = new_content.replace('ArrowLeft,', 'ArrowLeft, ArrowRight,')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Applied UI correctly")
