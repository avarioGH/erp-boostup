"use client";

import React, { useState } from "react";
import { PartaiAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";

export default function CreatePartaiPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) {
      setError("Kode partai wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      await PartaiAPI.createPartai(form);
      router.push('/inventory/partai');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || "Gagal membuat partai";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Buat Partai Baru</h1>
          <p className="text-sm text-muted-foreground">Buat wadah project baru</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Partai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Kode Partai <span className="text-red-500">*</span></Label>
              <Input 
                required 
                placeholder="Contoh: A/01/L02/GLI/ULIN" 
                value={form.code} 
                onChange={e => {
                  setForm({...form, code: e.target.value});
                  if (error) setError("");
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label>Nama / Keterangan</Label>
              <Input 
                placeholder="Contoh: Produksi Ulin Bulan Ini" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input 
                placeholder="Catatan tambahan..." 
                value={form.notes} 
                onChange={e => setForm({...form, notes: e.target.value})} 
              />
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Menyimpan..." : "Simpan Partai"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
