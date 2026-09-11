'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LogReceiving() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Log Datang / Receiving (DUKB Entry)</h1>
        <Button>Submit Raw Log</Button>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Raw Log Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <Label>Log Number</Label>
            <Input placeholder="e.g. LOG-001" />
          </div>
          <div className="space-y-2">
            <Label>Species</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select Species" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meranti">Meranti</SelectItem>
                <SelectItem value="kamper">Kamper</SelectItem>
                <SelectItem value="bengkirai">Bengkirai</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Partai / Origin</Label>
            <Input placeholder="Origin details" />
          </div>
          
          <div className="space-y-2">
            <Label>Length (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Diameter I (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Diameter II (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Diameter III (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Diameter IV (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
          
          <div className="space-y-2">
            <Label>Gerowong Diameter (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Trimming Length (cm)</Label>
            <Input type="number" placeholder="0" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Calculations Preview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-500">Average Diameter</div>
            <div className="text-xl font-bold">0.00 cm</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-500">Gross M3</div>
            <div className="text-xl font-bold">0.0000</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-500">Gerowong / Trim M3</div>
            <div className="text-xl font-bold">0.0000</div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="text-sm font-semibold text-primary">Net M3</div>
            <div className="text-xl font-bold text-primary">0.0000</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
