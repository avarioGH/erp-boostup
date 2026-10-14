import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ProcessingTypeItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  estimatedDurationHours?: number;
  costPerHour?: number;
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
        id: 'proc-kd-oven',
        code: 'KD',
        name: 'Kiln Dry (Oven)',
        category: 'DRYING',
        description: 'Proses pengeringan kayu menggunakan chamber oven (Kiln Dry)',
        estimatedDurationHours: 168,
        costPerHour: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-molding',
        code: 'MOLDING',
        name: 'Molding & Profiling',
        category: 'PLANING',
        description: 'Proses pembentukan profil, alur, serut 4 sisi (S4S / E4E / T&G)',
        estimatedDurationHours: 8,
        costPerHour: 0,
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
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-planing-s4s',
        code: 'S4S',
        name: 'Planing S4S / Ketam Rata',
        category: 'PLANING',
        description: 'Proses serut 4 sisi kayu halus presisi',
        estimatedDurationHours: 4,
        costPerHour: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-fingerjoint',
        code: 'FJ',
        name: 'Finger Joint / Laminating',
        category: 'ASSEMBLY',
        description: 'Penyambungan kayu model finger joint dan laminasi papan',
        estimatedDurationHours: 12,
        costPerHour: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-sanding',
        code: 'SANDING',
        name: 'Sanding (Amplas Halus)',
        category: 'FINISHING',
        description: 'Proses penghalusan permukaan kayu dengan mesin sander',
        estimatedDurationHours: 4,
        costPerHour: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'proc-treatment',
        code: 'TREATMENT',
        name: 'Anti-Termite Treatment (Vakum / Celup)',
        category: 'PRESERVATION',
        description: 'Pengawetan kayu anti rayap / bubuk sebelum atau sesudah oven',
        estimatedDurationHours: 24,
        costPerHour: 0,
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
