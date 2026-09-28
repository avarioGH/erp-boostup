const fs = require('fs');

// 1. BACKEND PURCHASE CONTROLLER
const ctrlPath = 'backend/src/inventory/purchase/purchase.controller.ts';
let ctrl = fs.readFileSync(ctrlPath, 'utf8');
if (!ctrl.includes('@Delete')) {
  ctrl = ctrl.replace(
    "import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';",
    "import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';"
  ).replace(
    "export class PurchaseController {",
    "export class PurchaseController {\n  @Delete(':id')\n  async delete(@Param('id') id: string) { return this.purchaseService.deletePurchase(id); }"
  );
  fs.writeFileSync(ctrlPath, ctrl, 'utf8');
}

// 2. BACKEND PURCHASE SERVICE
const svcPath = 'backend/src/inventory/purchase/purchase.service.ts';
let svc = fs.readFileSync(svcPath, 'utf8');
if (!svc.includes('async deletePurchase')) {
  const insertIndex = svc.lastIndexOf('}');
  const deleteFunc = `
  async deletePurchase(id: string) {
    const purchase = await this.prisma.timberPurchase.findUnique({ 
      where: { id },
      include: { 
        purchaseItems: { include: { purchaseLogItems: { include: { rawLogs: true } } } }
      }
    });
    if (!purchase) throw new Error('Purchase not found');
    
    // Check if any RawLog has been processed (status != AVAILABLE)
    for (const item of purchase.purchaseItems) {
      for (const logItem of item.purchaseLogItems) {
        for (const rawLog of logItem.rawLogs) {
          if (rawLog.status !== 'AVAILABLE') {
            throw new Error('Cannot delete purchase because some logs have already been processed (Trimming/Input).');
          }
        }
      }
    }

    // Delete RawLogs
    for (const item of purchase.purchaseItems) {
      for (const logItem of item.purchaseLogItems) {
        await this.prisma.rawLog.deleteMany({ where: { purchaseLogItemId: logItem.id } });
      }
    }
    
    // Delete Log Items
    for (const item of purchase.purchaseItems) {
      await this.prisma.timberPurchaseLogItem.deleteMany({ where: { purchaseItemId: item.id } });
    }

    // Delete Items
    await this.prisma.timberPurchaseItem.deleteMany({ where: { purchaseId: id } });

    // Delete Purchase
    return this.prisma.timberPurchase.delete({ where: { id } });
  }
`;
  svc = svc.substring(0, insertIndex) + deleteFunc + svc.substring(insertIndex);
  fs.writeFileSync(svcPath, svc, 'utf8');
}

// 3. FRONTEND PURCHASE UI
const pagePath = 'frontend/src/app/inventory/purchase/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');
if (!page.includes('DropdownMenu')) {
  page = page.replace(
    'import { Loader2, Plus, Search, ChevronRight, PackageOpen } from "lucide-react"',
    'import { Loader2, Plus, Search, ChevronRight, PackageOpen, MoreHorizontal, Eye, Pencil, Trash } from "lucide-react"\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"\nimport { useToast } from "@/hooks/use-toast"'
  ).replace(
    'export default function PurchasePage() {',
    'export default function PurchasePage() {\n  const { toast } = useToast();\n  const handleDelete = async (e: any, id: string) => {\n    e.stopPropagation();\n    if (!confirm("Are you sure you want to delete this purchase? All associated raw logs will be deleted.")) return;\n    try {\n      await TimberAPI.deletePurchase(id);\n      toast({ title: "Success", description: "Purchase deleted." });\n      fetchPurchases();\n    } catch (err: any) {\n      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });\n    }\n  };'
  ).replace(
    '<td className="py-3 px-6 text-center text-[13px]"><Button variant="outline" size="sm" className="text-xs">View Details</Button></td>',
    `<td className="py-3 px-6 text-center text-[13px]" onClick={e => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(\`/inventory/purchase/\${purchase.id}\`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(\`/inventory/purchase/\${purchase.id}/edit\`)}><Pencil className="w-4 h-4 mr-2" /> Edit Purchase</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleDelete(e, purchase.id)} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </td>`
  );
  fs.writeFileSync(pagePath, page, 'utf8');
}

console.log("Patched Purchase API & UI");
