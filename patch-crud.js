const fs = require('fs');

// 1. UPDATE FRONTEND API
let apiStr = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');
if (!apiStr.includes('deleteTrimmingLog')) {
  apiStr = apiStr.replace(
    "deleteLog: async (id: string) => (await api.delete('/inventory/logs/' + id)).data,",
    "deleteLog: async (id: string) => (await api.delete('/inventory/logs/' + id)).data,\n  deleteTrimmingLog: async (id: string) => (await api.delete('/inventory/trimming/' + id)).data,\n  deleteInputLog: async (id: string) => (await api.delete('/inventory/input-logs/' + id)).data,\n  deletePurchase: async (id: string) => (await api.delete('/inventory/purchase/' + id)).data,"
  );
  fs.writeFileSync('frontend/src/lib/api.ts', apiStr, 'utf8');
}

// 2. BACKEND TRIMMING
const trimCtrlPath = 'backend/src/inventory/trimmed-log.controller.ts';
let trimCtrl = fs.readFileSync(trimCtrlPath, 'utf8');
if (!trimCtrl.includes('@Delete')) {
  trimCtrl = trimCtrl.replace(
    "import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';",
    "import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';"
  ).replace(
    "export class TrimmedLogController {",
    "export class TrimmedLogController {\n  @Delete(':id')\n  async delete(@Param('id') id: string) { return this.service.deleteTrimmedLog(id); }"
  );
  fs.writeFileSync(trimCtrlPath, trimCtrl, 'utf8');
}

// 3. FRONTEND TRIMMING UI
const trimPagePath = 'frontend/src/app/inventory/trimming/page.tsx';
let trimPage = fs.readFileSync(trimPagePath, 'utf8');
if (!trimPage.includes('DropdownMenu')) {
  trimPage = trimPage.replace(
    'import { Loader2, Plus, Search, ChevronRight, Scissors } from "lucide-react"',
    'import { Loader2, Plus, Search, ChevronRight, Scissors, MoreHorizontal, Eye, Pencil, Trash } from "lucide-react"\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"\nimport { useToast } from "@/hooks/use-toast"'
  ).replace(
    'export default function TrimmingPage() {',
    'export default function TrimmingPage() {\n  const { toast } = useToast();\n  const handleDelete = async (e: any, id: string) => {\n    e.stopPropagation();\n    if (!confirm("Are you sure you want to delete this log?")) return;\n    try {\n      await TimberAPI.deleteTrimmingLog(id);\n      toast({ title: "Success", description: "Log deleted." });\n      fetchLogs();\n    } catch (err: any) {\n      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });\n    }\n  };'
  ).replace(
    '<td className="py-3 px-6 text-center text-[13px]"><Button variant="outline" size="sm" className="text-xs">View Details</Button></td>',
    `<td className="py-3 px-6 text-center text-[13px]" onClick={e => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(\`/inventory/trimming/\${log.id}\`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(\`/inventory/trimming/\${log.id}/edit\`)}><Pencil className="w-4 h-4 mr-2" /> Edit Log</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleDelete(e, log.id)} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Log</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </td>`
  );
  fs.writeFileSync(trimPagePath, trimPage, 'utf8');
}

console.log("Patched Trimming API & UI");
