const fs = require('fs');

// 1. BACKEND INPUT LOG CONTROLLER
const ctrlPath = 'backend/src/inventory/input-log.controller.ts';
let ctrl = fs.readFileSync(ctrlPath, 'utf8');
if (!ctrl.includes('@Delete')) {
  ctrl = ctrl.replace(
    "import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';",
    "import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';"
  ).replace(
    "export class InputLogController {",
    "export class InputLogController {\n  @Delete(':id')\n  async delete(@Param('id') id: string) { return this.service.deleteInputLog(id); }"
  );
  fs.writeFileSync(ctrlPath, ctrl, 'utf8');
}

// 2. BACKEND INPUT LOG SERVICE
const svcPath = 'backend/src/inventory/input-log.service.ts';
let svc = fs.readFileSync(svcPath, 'utf8');
if (!svc.includes('async deleteInputLog')) {
  const insertIndex = svc.lastIndexOf('}');
  const deleteFunc = `
  async deleteInputLog(id: string) {
    const inputLog = await this.prisma.inputLog.findUnique({ where: { id }, include: { inputLogItems: true } });
    if (!inputLog) throw new Error('Input Log not found');
    
    // Kembalikan status TrimmedLog ke AVAILABLE
    for (const item of inputLog.inputLogItems) {
      if (item.trimmedLogId) {
        await this.prisma.trimmedLog.update({
          where: { id: item.trimmedLogId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    // Delete items first
    await this.prisma.inputLogItem.deleteMany({ where: { inputLogId: id } });
    // Delete log
    return this.prisma.inputLog.delete({ where: { id } });
  }
`;
  svc = svc.substring(0, insertIndex) + deleteFunc + svc.substring(insertIndex);
  fs.writeFileSync(svcPath, svc, 'utf8');
}

// 3. FRONTEND INPUT LOG UI
const pagePath = 'frontend/src/app/inventory/input-logs/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');
if (!page.includes('DropdownMenu')) {
  page = page.replace(
    'import { Loader2, Plus, Search, ChevronRight, Download } from "lucide-react"',
    'import { Loader2, Plus, Search, ChevronRight, Download, MoreHorizontal, Eye, Pencil, Trash } from "lucide-react"\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"\nimport { useToast } from "@/hooks/use-toast"'
  ).replace(
    'export default function InputLogsPage() {',
    'export default function InputLogsPage() {\n  const { toast } = useToast();\n  const handleDelete = async (e: any, id: string) => {\n    e.stopPropagation();\n    if (!confirm("Are you sure you want to delete this log?")) return;\n    try {\n      await TimberAPI.deleteInputLog(id);\n      toast({ title: "Success", description: "Log deleted." });\n      fetchLogs();\n    } catch (err: any) {\n      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });\n    }\n  };'
  ).replace(
    '<td className="py-3 px-6 text-center text-[13px]"><Button variant="outline" size="sm" className="text-xs">View Details</Button></td>',
    `<td className="py-3 px-6 text-center text-[13px]" onClick={e => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(\`/inventory/input-logs/\${log.id}\`)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(\`/inventory/input-logs/\${log.id}/edit\`)}><Pencil className="w-4 h-4 mr-2" /> Edit Log</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleDelete(e, log.id)} className="text-destructive"><Trash className="w-4 h-4 mr-2" /> Delete Log</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </td>`
  );
  fs.writeFileSync(pagePath, page, 'utf8');
}

console.log("Patched Input Log API & UI");
