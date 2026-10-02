import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async getCustomerWithFinancials(companyId: string, id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id, company_id: companyId }
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // Aggregate Sales Orders
    const salesOrders = await this.prisma.salesOrder.findMany({
      where: { customer_id: id, company_id: companyId, status: { notIn: ['CANCELLED'] } },
      include: {
        allocations: true
      },
      orderBy: { order_date: 'desc' }
    });

    let totalSales = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    const formattedSOs = salesOrders.map(so => {
      totalSales += so.total_amount;
      const paid = so.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      totalPaid += paid;
      const outstanding = so.total_amount - paid;
      if (outstanding > 0.01) totalOutstanding += outstanding;
      
      return {
        ...so,
        paid_amount: paid,
        outstanding
      };
    });

    // Payments history
    const payments = await this.prisma.payment.findMany({
      where: { customer_id: id, company_id: companyId },
      orderBy: { payment_date: 'desc' }
    });

    return {
      customer,
      financials: {
        totalSales,
        totalPaid,
        totalOutstanding
      },
      salesOrders: formattedSOs,
      payments
    };
  }

  async getCustomersWithReceivables(companyId: string, search?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = { company_id: companyId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.customer.count({ where })
    ]);

    // For each customer, get their outstanding balance
    // In a real app with 10k customers we would use raw SQL aggregation.
    // For now we will do a fast lookup for the fetched page.
    const customerIds = customers.map(c => c.id);
    
    const salesOrders = await this.prisma.salesOrder.findMany({
      where: { customer_id: { in: customerIds }, company_id: companyId, status: { notIn: ['CANCELLED'] } },
      include: { allocations: true }
    });

    const soByCustomer: Record<string, typeof salesOrders> = {};
    for (const so of salesOrders) {
      if (!soByCustomer[so.customer_id as string]) soByCustomer[so.customer_id as string] = [];
      soByCustomer[so.customer_id as string].push(so);
    }

    const data = customers.map(c => {
      const sos = soByCustomer[c.id] || [];
      let totalSales = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;
      
      for (const so of sos) {
        totalSales += so.total_amount;
        const paid = so.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        totalPaid += paid;
        const outstanding = so.total_amount - paid;
        if (outstanding > 0.01) totalOutstanding += outstanding;
      }
      
      return {
        ...c,
        totalSales,
        totalPaid,
        totalOutstanding
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

