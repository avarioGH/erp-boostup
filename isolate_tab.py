# -*- coding: utf-8 -*-
import re
filepath = r"frontend\src\app\inventory\partai\[id]\page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace Tab 4 and 5 with my previous script, but without the style tag.
start4 = content.find('<TabsContent value="input">')
end5 = content.find('</TabsContent>', content.find('<TabsContent value="output">')) + 14

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
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-1 items-center">
                          <span className="font-medium text-foreground/80">{i.species}</span> - {i.items?.length || 0} Source Logs
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle>Test</CardTitle>
            </CardHeader>
          </Card>
        </TabsContent>"""

with open('frontend/src/app/inventory/partai/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content[:start4] + replacement + content[end5:])
