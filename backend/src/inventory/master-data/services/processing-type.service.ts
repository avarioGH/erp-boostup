import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: string[]; // for select type
  placeholder?: string;
  required?: boolean;
}

export interface ProcessingTypeItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  estimatedDurationHours?: number;
  costPerHour?: number;
  customFields?: CustomFieldDefinition[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ProcessingTypeService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSetting(companyId: string) {
    let setting = await this.prisma.companySetting.findUnique({
      where: { company_id: companyId },
    });
    if (!setting) {
      setting = await this.prisma.companySetting.create({
        data: { company_id: companyId },
      });
    }
    return setting;
  }

  private parseList(logoField: string | null | undefined): ProcessingTypeItem[] {
    if (!logoField) {
      return this.getDefaults();
    }
    try {
      if (logoField.startsWith('{') || logoField.startsWith('[')) {
        const parsed = JSON.parse(logoField);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.processing_types)) return parsed.processing_types;
      }
    } catch (e) {}
    return this.getDefaults();
  }

  private getDefaults(): ProcessingTypeItem[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'proc-gesek',
        code: 'GESEK',
        name: 'Sawing / Pembelahan (Gesek)',
        category: 'SAWING',
        description: 'Proses pembelahan log atau balok menjadi papan / reng / balok',
        estimatedDurationHours: 8,
        costPerHour: 0,
        customFields: [
          { key: 'machineNo', label: 'No. Mesin Sawmill', placeholder: 'Mesin 1, Mesin 2' },
          { key: 'logCode', label: 'Kode / No Log', placeholder: 'Contoh: 5357' },
          { key: 'shift', label: 'Shift / Operator', placeholder: 'Shift 1 - Edy' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-kd-oven',
        code: 'KD',
        name: 'Kiln Dry (Oven)',
        category: 'DRYING',
        description: 'Proses pengeringan kayu menggunakan chamber oven (Kiln Dry)',
        estimatedDurationHours: 168,
        costPerHour: 0,
        customFields: [
          { key: 'kdNumber', label: 'Nomor KD / Chamber', placeholder: 'MA 13 / Chamber 1' },
          { key: 'mcInitial', label: 'MC Awal (%)', type: 'number', placeholder: '35%' },
          { key: 'mcFinal', label: 'MC Target / Akhir (%)', type: 'number', placeholder: '12%' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-molding',
        code: 'MOULDING',
        name: 'Molding & Profiling',
        category: 'PLANING',
        description: 'Proses pembentukan profil, alur, serut 4 sisi (S4S / E4E / T&G)',
        estimatedDurationHours: 8,
        costPerHour: 0,
        customFields: [
          { key: 'palletNo', label: 'No. Palet (NO.PLT)', placeholder: 'Contoh: 6579' },
          { key: 'containerNo', label: 'No. Container (CONT)', placeholder: 'Contoh: Cont 1' },
          { key: 'profileType', label: 'Profil / Pisau Pisau', placeholder: 'E4E / Decking' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-planing-s4s',
        code: 'PLANNER',
        name: 'Planing / Planner (Ketam Rata)',
        category: 'PLANING',
        description: 'Proses serut 4 sisi kayu halus presisi',
        estimatedDurationHours: 4,
        costPerHour: 0,
        customFields: [
          { key: 'palletNo', label: 'No. Palet (NO.PLT)', placeholder: 'Contoh: 6581' },
          { key: 'containerNo', label: 'No. Container (CONT)', placeholder: 'Contoh: Cont 1' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-crosscut',
        code: 'CROSSCUT',
        name: 'Crosscut / Trimming',
        category: 'SAWING',
        description: 'Pemotongan panjang dan perapian ujung kayu',
        estimatedDurationHours: 4,
        costPerHour: 0,
        customFields: [
          { key: 'palletNo', label: 'No. Palet (NO.PLT)', placeholder: 'Contoh: 6590' },
          { key: 'containerNo', label: 'No. Container (CONT)', placeholder: 'Contoh: Cont 1' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-resawing',
        code: 'RESAW',
        name: 'Re-Sawing (Gesek Pembelahan)',
        category: 'SAWING',
        description: 'Proses pembelahan ulang balok / papan menjadi dimensi lebih tipis/kecil',
        estimatedDurationHours: 8,
        costPerHour: 0,
        customFields: [
          { key: 'machineNo', label: 'No. Mesin Resaw', placeholder: 'Resaw A' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-packing',
        code: 'PACKING',
        name: 'Packing & Bundling',
        category: 'PACKING',
        description: 'Pengikatan, strapping, dan telly sheet kemasan palet akhir',
        estimatedDurationHours: 4,
        costPerHour: 0,
        customFields: [
          { key: 'palletNo', label: 'No. Palet (NO.PLT)', placeholder: 'Contoh: 01' },
          { key: 'containerNo', label: 'No. Container (CONT)', placeholder: 'Contoh: Cont 1' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-sipot',
        code: 'SIPOT',
        name: 'Sisa Potong (Sipot / Afkir)',
        category: 'SAWING',
        description: 'Pencatatan sisa potongan kayu atau afkir dari proses',
        estimatedDurationHours: 2,
        costPerHour: 0,
        customFields: [
          { key: 'palletNo', label: 'No. Palet Asal', placeholder: 'Contoh: 6780' },
        ],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private async saveList(companyId: string, list: ProcessingTypeItem[]) {
    const setting = await this.getSetting(companyId);
    let existingObj: any = {};
    if (setting.logo) {
      try {
        if (setting.logo.startsWith('{')) {
          existingObj = JSON.parse(setting.logo);
        }
      } catch (e) {}
    }
    existingObj.processing_types = list;
    await this.prisma.companySetting.update({
      where: { company_id: companyId },
      data: { logo: JSON.stringify(existingObj) },
    });
  }

  async findAll(companyId: string) {
    const setting = await this.getSetting(companyId);
    return this.parseList(setting.logo);
  }

  async findOne(id: string, companyId: string) {
    const list = await this.findAll(companyId);
    const item = list.find((x) => x.id === id || x.code.toUpperCase() === id.toUpperCase());
    if (!item) throw new NotFoundException('Jenis pemrosesan tidak ditemukan');
    return item;
  }

  async create(companyId: string, data: any) {
    const list = await this.findAll(companyId);
    const code = (data.code || '').trim().toUpperCase();
    if (list.some((x) => x.code.toUpperCase() === code)) {
      throw new Error(`Kode proses "${code}" sudah terdaftar.`);
    }

    const newItem: ProcessingTypeItem = {
      id: `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code,
      name: data.name?.trim() || code,
      category: data.category?.trim() || 'PROCESSING',
      description: data.description?.trim() || '',
      estimatedDurationHours: Number(data.estimatedDurationHours || 0),
      costPerHour: Number(data.costPerHour || 0),
      customFields: Array.isArray(data.customFields) ? data.customFields : [],
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(newItem);
    await this.saveList(companyId, list);
    return newItem;
  }

  async update(companyId: string, id: string, data: any) {
    const list = await this.findAll(companyId);
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundException('Jenis pemrosesan tidak ditemukan');

    const updated = {
      ...list[idx],
      code: data.code !== undefined ? data.code.trim().toUpperCase() : list[idx].code,
      name: data.name !== undefined ? data.name.trim() : list[idx].name,
      category: data.category !== undefined ? data.category.trim() : list[idx].category,
      description: data.description !== undefined ? data.description.trim() : list[idx].description,
      estimatedDurationHours: data.estimatedDurationHours !== undefined ? Number(data.estimatedDurationHours) : list[idx].estimatedDurationHours,
      costPerHour: data.costPerHour !== undefined ? Number(data.costPerHour) : list[idx].costPerHour,
      customFields: data.customFields !== undefined ? (Array.isArray(data.customFields) ? data.customFields : []) : list[idx].customFields,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : list[idx].isActive,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    await this.saveList(companyId, list);
    return updated;
  }

  async delete(companyId: string, id: string) {
    const list = await this.findAll(companyId);
    const filtered = list.filter((x) => x.id !== id);
    await this.saveList(companyId, filtered);
    return { success: true, message: 'Jenis pemrosesan berhasil dihapus' };
  }
}
