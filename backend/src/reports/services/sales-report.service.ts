import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFilterDto, ReportResultDto } from '../report.types';

@Injectable()
export class SalesReportService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(filters: ReportFilterDto): Promise<ReportResultDto> {
    const where: any = {
      company_id: filters.company_id,
      status: 'POSTED',
      type: 'AR',
    };
    if (filters.start_date || filters.end_date) {
      where.invoice_date = {};
      if (filters.start_date)
        where.invoice_date.gte = new Date(filters.start_date);
      if (filters.end_date) where.invoice_date.lte = new Date(filters.end_date);
    }
    if (filters.customer_id) where.customer_id = filters.customer_id;

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { customer: true, sales_order: true },
    });

    let total = 0;
    let totalTax = 0;
    let netSales = 0;

    const data: any[] = [];

    // 1. Process standard Invoices
    for (const inv of invoices) {
      total += inv.total;
      totalTax += inv.tax;
      netSales += inv.subtotal;
      data.push({
        invoice_number: inv.invoice_number,
        date: inv.invoice_date.toISOString().split('T')[0],
        customer: inv.customer?.name || (inv.sales_order?.channel === 'POS' ? 'Pelanggan Kasir (POS)' : '-'),
        subtotal: inv.subtotal,
        tax: inv.tax,
        total: inv.total,
        channel: inv.sales_order?.channel || 'B2B',
      });
    }

    // 2. Process Completed Sales Orders without separate Invoice (POS direct sales)
    const soWhere: any = {
      company_id: filters.company_id,
      status: 'COMPLETED',
      invoices: { none: {} },
    };
    if (filters.start_date || filters.end_date) {
      soWhere.order_date = {};
      if (filters.start_date) soWhere.order_date.gte = new Date(filters.start_date);
      if (filters.end_date) soWhere.order_date.lte = new Date(filters.end_date);
    }
    const directSalesOrders = await this.prisma.salesOrder.findMany({
      where: soWhere,
      include: { customer: true },
      orderBy: { order_date: 'desc' },
    });

    for (const so of directSalesOrders) {
      const amount = so.total_amount || 0;
      total += amount;
      netSales += amount;
      data.push({
        invoice_number: so.order_number,
        date: so.order_date.toISOString().split('T')[0],
        customer: so.customer?.name || 'Pelanggan Kasir (POS)',
        subtotal: amount,
        tax: 0,
        total: amount,
        channel: so.channel || 'POS',
      });
    }

    return {
      title: 'Sales Report',
      columns: [
        { header: 'No. Transaksi / Faktur', key: 'invoice_number' },
        { header: 'Tanggal', key: 'date', type: 'date' },
        { header: 'Pelanggan', key: 'customer' },
        { header: 'Channel', key: 'channel' },
        { header: 'Subtotal (Net)', key: 'subtotal', type: 'currency' },
        { header: 'Pajak', key: 'tax', type: 'currency' },
        { header: 'Total (Gross)', key: 'total', type: 'currency' },
      ],
      data,
      totals: { subtotal: netSales, tax: totalTax, total: total },
    };
  }

  async getGrossMarginReport(
    filters: ReportFilterDto,
  ): Promise<ReportResultDto> {
    const where: any = {
      company_id: filters.company_id,
      status: 'POSTED',
      type: 'AR',
    };
    if (filters.start_date || filters.end_date) {
      where.invoice_date = {};
      if (filters.start_date)
        where.invoice_date.gte = new Date(filters.start_date);
      if (filters.end_date) where.invoice_date.lte = new Date(filters.end_date);
    }
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { customer: true, sales_order: true },
    });

    let data: any[] = [];

    // 1. Invoices
    for (const inv of invoices) {
      let cogs = 0;
      if (inv.sales_order_id) {
        const deliveries = await this.prisma.deliveryOrder.findMany({
          where: { sales_order_id: inv.sales_order_id, status: 'DELIVERED' },
          include: { items: true },
        });
        for (const del of deliveries) {
          const movs = await this.prisma.stockMovement.findMany({
            where: { transaction_id: del.id, movement_type: 'OUT' },
          });
          cogs += movs.reduce((sum, m) => sum + m.total_cost, 0);
        }
      }

      data.push({
        invoice_number: inv.invoice_number,
        customer: inv.customer?.name || (inv.sales_order?.channel === 'POS' ? 'Pelanggan Kasir (POS)' : '-'),
        revenue: inv.subtotal,
        cogs,
        margin: inv.subtotal - cogs,
      });
    }

    // 2. Include POS Direct Sales Orders (Sales + POS combined)
    const soWhere: any = {
      company_id: filters.company_id,
      status: 'COMPLETED',
      invoices: { none: {} },
    };
    if (filters.start_date || filters.end_date) {
      soWhere.order_date = {};
      if (filters.start_date) soWhere.order_date.gte = new Date(filters.start_date);
      if (filters.end_date) soWhere.order_date.lte = new Date(filters.end_date);
    }
    const directSalesOrders = await this.prisma.salesOrder.findMany({
      where: soWhere,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { order_date: 'desc' },
    });

    for (const so of directSalesOrders) {
      // Find COGS from stock movements for this POS sale
      const movs = await this.prisma.stockMovement.findMany({
        where: { transaction_id: so.id, movement_type: 'OUT' },
      });
      let posCogs = movs.reduce((sum, m) => sum + (m.total_cost || 0), 0);
      
      // Fallback: calculate from purchase_price if stockMovement cost was 0
      if (posCogs === 0 && so.items) {
        posCogs = so.items.reduce((sum, it) => sum + (it.qty * (it.product?.purchase_price || 0)), 0);
      }

      const rev = so.total_amount || 0;
      data.push({
        invoice_number: so.order_number,
        customer: so.customer?.name || 'Pelanggan Kasir (POS)',
        revenue: rev,
        cogs: posCogs,
        margin: rev - posCogs,
      });
    }

    let sumRev = 0,
      sumCogs = 0,
      sumMargin = 0;
    data.forEach((d) => {
      sumRev += d.revenue;
      sumCogs += d.cogs;
      sumMargin += d.margin;
    });

    return {
      title: 'Gross Margin Report',
      columns: [
        { header: 'Nomor Faktur / Transaksi', key: 'invoice_number' },
        { header: 'Pelanggan', key: 'customer' },
        { header: 'Pendapatan', key: 'revenue', type: 'currency' },
        { header: 'HPP (COGS)', key: 'cogs', type: 'currency' },
        { header: 'Laba Kotor', key: 'margin', type: 'currency' },
      ],
      data,
      totals: { revenue: sumRev, cogs: sumCogs, margin: sumMargin },
    };
  }
}
