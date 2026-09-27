"use client";

import { useEffect, useState } from "react";
import { MasterDataAPI, InventoryAPI, PurchaseAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Info } from "lucide-react";

export default function CreatePurchasePage() {
  const router = useRouter();
  const [sources, setSources] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [purchaseType, setPurchaseType] = useState<"SAWN_TIMBER" | "LOG">("SAWN_TIMBER");

  const [form, setForm] = useState({
    sourceId: "",
    warehouseId: "",
    purchaseNumber: "",
    items: [{ timberVariantId: "", quantityPcs: 1, volumeM3: 0, batch: "", notes: "", purchaseThickness: "", purchaseWidth: "", purchaseLength: "", unitPrice: "" }],
    logItems: [{ logNumber: "", speciesId: "", purchaseLength: "", purchaseDiameter1: "", purchaseDiameter2: "", purchaseDiameter3: "", purchaseDiameter4: "", purchaseVolume: "", unitPrice: "", batch: "", notes: "" }]
  });

  useEffect(() => {
    MasterDataAPI.getSources().then((res: any) => setSources(res?.data || res || []));
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(res?.data || res || []));
    InventoryAPI.getVariants().then((res: any) => setVariants(res?.data || res || []));
    MasterDataAPI.getSpecies().then((res: any) => setSpeciesList(res?.data || res || []));
  }, []);

  const getVariant = (id: string) => variants.find((v: any) => v.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!form.sourceId) throw new Error("Please select a Supplier");
      if (!form.warehouseId) throw new Error("Please select a Warehouse");
      if (!form.purchaseNumber.trim()) throw new Error("Purchase Number is required");
      
      const payload: any = {
        sourceId: form.sourceId,
        warehouseId: form.warehouseId,
        purchaseNumber: form.purchaseNumber,
        items: [],
        logItems: []
      };

      if (purchaseType === "SAWN_TIMBER") {
        if (form.items.length === 0) throw new Error("Add at least one item");
        for (const item of form.items) {
          if (!item.timberVariantId) throw new Error("Variant is required for all items");
          if (item.quantityPcs <= 0) throw new Error("Quantity must be greater than 0");
          if (!item.batch || item.batch.trim() === "") throw new Error("Partai (Batch) is required for all items");
        }
        payload.items = form.items;
      } else {
        if (form.logItems.length === 0) throw new Error("Add at least one log");
        for (const log of form.logItems) {
          if (!log.logNumber) throw new Error("Log Number is required");
          if (!log.speciesId) throw new Error("Species is required");
          if (!log.purchaseLength) throw new Error("Length is required");
        }
        payload.logItems = form.logItems;
      }

      await PurchaseAPI.createPurchase(payload);
      router.push("/inventory/purchase");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    (newItems[index] as any)[field] = value;
    if (field === "timberVariantId" || field === "quantityPcs") {
      const v = getVariant(newItems[index].timberVariantId);
      if (v && newItems[index].quantityPcs) {
        newItems[index].volumeM3 = Number((v.volumePerPiece * newItems[index].quantityPcs).toFixed(6));
      }
    }
    setForm({ ...form, items: newItems });
  };

  const handleLogChange = (index: number, field: string, value: any) => {
    const newLogs = [...form.logItems];
    (newLogs[index] as any)[field] = value;
    
    // Auto-calculate average diameter and volume if dims exist
    const log = newLogs[index];
    const L = Number(log.purchaseLength) || 0;
    const d1 = Number(log.purchaseDiameter1) || 0;
    const d2 = Number(log.purchaseDiameter2) || 0;
    const d3 = Number(log.purchaseDiameter3) || 0;
    const d4 = Number(log.purchaseDiameter4) || 0;
    
    if (L > 0 && (d1 || d2 || d3 || d4)) {
      const counts = [d1, d2, d3, d4].filter(d => d > 0);
      if (counts.length > 0) {
        const sum = counts.reduce((a,b) => a+b, 0);
        const avgD = sum / counts.length;
        // Basic log volume formula (L in cm, avgD in cm)
        // Vol = π * (D/2)^2 * L / 1,000,000
        const vol = Math.PI * Math.pow(avgD/2, 2) * (L) / 1000000;
        // Actually, let's leave volume manual or basic calculated, user can override
      }
    }
    
    setForm({ ...form, logItems: newLogs });
  };

  const totalPcs = form.items.reduce((acc, item) => acc + (item.quantityPcs || 0), 0);
  const totalM3 = form.items.reduce((acc, item) => acc + (item.volumeM3 || 0), 0);
  
  const totalLogs = form.logItems.length;
  const totalLogM3 = form.logItems.reduce((acc, log) => acc + (Number(log.purchaseVolume) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Purchase</h1>
          <p className="text-muted-foreground">Register new timber purchase from suppliers.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Purchase Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Purchase Type *</Label>
              <Select value={purchaseType} onValueChange={(val: any) => setPurchaseType(val)}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAWN_TIMBER">🪚 SAWN TIMBER</SelectItem>
                  <SelectItem value="LOG">🪵 LOG KAYU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Purchase Reference Number *</Label>
              <Input placeholder="PO-2026-..." value={form.purchaseNumber} onChange={(e) => setForm({ ...form, purchaseNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Supplier (Timber Source) *</Label>
              <Select value={form.sourceId} onValueChange={(val: any) => setForm({ ...form, sourceId: val || "" })}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>
                  {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <Select value={form.warehouseId} onValueChange={(val: any) => setForm({ ...form, warehouseId: val || "" })}>
                <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name || w.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {purchaseType === "SAWN_TIMBER" && (
        <Card>
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">2. Sawn Timber Items</CardTitle>
              <CardDescription>Input the physical Sawn Timber purchased. Do not input Raw Logs here.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, items: [...form.items, { timberVariantId: "", quantityPcs: 1, volumeM3: 0, batch: "", notes: "", purchaseThickness: "", purchaseWidth: "", purchaseLength: "", unitPrice: "" }] })}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.items.map((item, index) => {
              const variantObj = getVariant(item.timberVariantId);
              return (
                <div key={index} className="border p-4 rounded-lg bg-muted/20 relative space-y-4">
                  {form.items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4 mr-8">
                    <div className="space-y-2">
                      <Label>Product / Variant *</Label>
                      <Select value={item.timberVariantId} onValueChange={(val: any) => handleItemChange(index, 'timberVariantId', val)}>
                        <SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger>
                        <SelectContent>
                          {variants.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.species} - {v.grade} - {v.thickness}x{v.width}x{v.length}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-semibold">Supplier Declaration</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-md bg-background">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Thickness (mm)</Label>
                        <Input type="number" min="1" placeholder="Thickness" value={item.purchaseThickness || ""} onChange={(e) => handleItemChange(index, 'purchaseThickness', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Width (mm)</Label>
                        <Input type="number" min="1" placeholder="Width" value={item.purchaseWidth || ""} onChange={(e) => handleItemChange(index, 'purchaseWidth', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Length (mm)</Label>
                        <Input type="number" min="1" placeholder="Length" value={item.purchaseLength || ""} onChange={(e) => handleItemChange(index, 'purchaseLength', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity (PCS) *</Label>
                      <Input type="number" min="1" value={item.quantityPcs || ""} onChange={(e) => handleItemChange(index, 'quantityPcs', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Canonical M&sup3;</Label>
                      <Input type="number" value={item.volumeM3 || ""} readOnly className="bg-muted font-bold text-primary" title="Calculated from canonical variant" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Price (Rp)</Label>
                      <Input type="number" min="0" placeholder="0" value={item.unitPrice || ""} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Batch / Partai *</Label>
                      <Input 
                        placeholder="Contoh: PRT-2026-A"
                        value={item.batch} 
                        onChange={(e) => handleItemChange(index, 'batch', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input placeholder="Optional remarks" value={item.notes} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center pt-4 px-2">
               <div className="text-sm text-muted-foreground flex items-center gap-2">
                 <Info className="w-4 h-4"/> Sawn timber is strictly purchased by PCS. M3 is auto-calculated.
               </div>
               <div className="text-right space-y-1">
                 <div className="text-sm text-muted-foreground">Total:</div>
                 <div className="text-lg font-bold">{totalPcs.toLocaleString()} PCS</div>
                 <div className="text-primary font-bold">{totalM3.toFixed(4)} M&sup3;</div>
               </div>
            </div>
          </CardContent>
        </Card>
        )}

        {purchaseType === "LOG" && (
        <Card>
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">2. Purchase Logs</CardTitle>
              <CardDescription>Input the Raw Logs declared by supplier. Will not add stock directly.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, logItems: [...form.logItems, { logNumber: "", speciesId: "", purchaseLength: "", purchaseDiameter1: "", purchaseDiameter2: "", purchaseDiameter3: "", purchaseDiameter4: "", purchaseVolume: "", unitPrice: "", batch: "", notes: "" }] })}>
              <Plus className="w-4 h-4 mr-2" /> Add Log
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.logItems.map((log, index) => {
              
              const avgD = (Number(log.purchaseDiameter1||0)+Number(log.purchaseDiameter2||0)+Number(log.purchaseDiameter3||0)+Number(log.purchaseDiameter4||0)) / [Number(log.purchaseDiameter1||0),Number(log.purchaseDiameter2||0),Number(log.purchaseDiameter3||0),Number(log.purchaseDiameter4||0)].filter(d=>d>0).length || 0;

              return (
                <div key={index} className="border p-4 rounded-lg bg-muted/20 relative space-y-4">
                  {form.logItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => setForm({ ...form, logItems: form.logItems.filter((_, i) => i !== index) })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                    <div className="space-y-2">
                      <Label>Log Number *</Label>
                      <Input placeholder="LOG-001" value={log.logNumber} onChange={(e) => handleLogChange(index, 'logNumber', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Species *</Label>
                      <Select value={log.speciesId} onValueChange={(val: any) => handleLogChange(index, 'speciesId', val)}>
                        <SelectTrigger><SelectValue placeholder="Select Species" /></SelectTrigger>
                        <SelectContent>
                          {speciesList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-semibold">Supplier Measurement</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border p-3 rounded-md bg-background">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Length (cm) *</Label>
                        <Input type="number" min="1" placeholder="400" value={log.purchaseLength || ""} onChange={(e) => handleLogChange(index, 'purchaseLength', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">D1 (cm)</Label>
                        <Input type="number" min="0" placeholder="0" value={log.purchaseDiameter1 || ""} onChange={(e) => handleLogChange(index, 'purchaseDiameter1', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">D2 (cm)</Label>
                        <Input type="number" min="0" placeholder="0" value={log.purchaseDiameter2 || ""} onChange={(e) => handleLogChange(index, 'purchaseDiameter2', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">D3 (cm)</Label>
                        <Input type="number" min="0" placeholder="0" value={log.purchaseDiameter3 || ""} onChange={(e) => handleLogChange(index, 'purchaseDiameter3', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">D4 (cm)</Label>
                        <Input type="number" min="0" placeholder="0" value={log.purchaseDiameter4 || ""} onChange={(e) => handleLogChange(index, 'purchaseDiameter4', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Average Diameter</Label>
                      <Input type="number" value={avgD ? avgD.toFixed(2) : ""} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier Volume (M&sup3;)</Label>
                      <Input type="number" min="0" step="0.0001" placeholder="0.0000" value={log.purchaseVolume || ""} onChange={(e) => handleLogChange(index, 'purchaseVolume', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Price (Rp)</Label>
                      <Input type="number" min="0" placeholder="0" value={log.unitPrice || ""} onChange={(e) => handleLogChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Batch / Partai</Label>
                      <Input placeholder="Contoh: BATCH-LOG-A" value={log.batch} onChange={(e) => handleLogChange(index, 'batch', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input placeholder="Optional remarks" value={log.notes} onChange={(e) => handleLogChange(index, 'notes', e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center pt-4 px-2">
               <div className="text-sm text-muted-foreground flex items-center gap-2">
                 <Info className="w-4 h-4"/> 1 Log = 1 Quantity
               </div>
               <div className="text-right space-y-1">
                 <div className="text-sm text-muted-foreground">Total:</div>
                 <div className="text-lg font-bold">{totalLogs} Logs</div>
                 <div className="text-primary font-bold">{totalLogM3.toFixed(4)} M&sup3;</div>
               </div>
            </div>
          </CardContent>
        </Card>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Submit Purchase"}</Button>
        </div>
      </form>
    </div>
  );
}
