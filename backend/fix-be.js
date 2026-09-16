const fs = require('fs');
const path = 'src/inventory/inventory.service.ts';
let content = fs.readFileSync(path, 'utf8');

const newMethod = \
  async deleteWarehouse(companyId: string, id: string) {
    const existing = await this.prisma.warehouse.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Warehouse not found');
    
    // Check constraints before deleting
    const rawLogs = await this.prisma.rawLog.count({ where: { locationId: id } });
    if (rawLogs > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena masih berisi data Raw Log.');

    const trimLogs = await this.prisma.trimmedLog.count({ where: { locationId: id } });
    if (trimLogs > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena masih berisi data Trimmed Log.');

    const inputLogs = await this.prisma.inputLog.count({ where: { locationId: id } });
    if (inputLogs > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena masih berisi data Input Log.');

    const sawnOut = await this.prisma.sawnTimberOutput.count({ where: { locationId: id } });
    if (sawnOut > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena masih berisi Sawn Timber Output.');

    const transactions = await this.prisma.inventoryTransaction.count({ where: { OR: [{warehouse_id: id}, {target_warehouse_id: id}] } });
    if (transactions > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena sudah memiliki riwayat Transaksi Inventori.');

    const movements = await this.prisma.stockMovement.count({ where: { warehouse_id: id } });
    if (movements > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena sudah memiliki riwayat Pergerakan Stok.');

    const chamber = await this.prisma.chamber.count({ where: { locationId: id } });
    if (chamber > 0) throw new BadRequestException('Gudang tidak dapat dihapus karena masih terikat dengan modul Kiln Chamber. Hapus Chamber tersebut terlebih dahulu.');

    const timberStock = await this.prisma.timberStock.count({ where: { locationId: id } });
    
    return this.prisma.\\$transaction(async (tx) => {
      await tx.userWarehouseAccess.deleteMany({ where: { warehouse_id: id } });
      await tx.warehouseStock.deleteMany({ where: { warehouse_id: id } });
      if (timberStock > 0) await tx.timberStock.deleteMany({ where: { locationId: id } });
      
      return tx.warehouse.delete({ where: { id } }).catch(e => {
         throw new BadRequestException('Gagal menghapus gudang karena masih ada data yang terikat (Error P2014).');
      });
    });
  }
\;

const startIdx = content.indexOf('async deleteWarehouse(companyId: string, id: string)');
const endString = '      });\\n    }';
const endIdx = content.indexOf(endString, startIdx) + endString.length;

if (startIdx > -1 && endIdx > -1) {
  content = content.substring(0, startIdx) + newMethod + content.substring(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Backend deleteWarehouse successfully updated!');
} else {
  console.error('Could not find bounds');
}
