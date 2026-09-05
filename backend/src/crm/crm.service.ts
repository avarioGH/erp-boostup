import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // ============================
  // LEADS
  // ============================
  async getLeads(companyId: string) {
    return this.prisma.lead.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: { opportunities: true, activities: true }
    });
  }

  async getLead(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, company_id: companyId },
      include: { opportunities: true, activities: true }
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async createLead(companyId: string, data: any) {
    return this.prisma.lead.create({
      data: {
        company_id: companyId,
        lead_code: data.lead_code || `LD-${Date.now()}`,
        name: data.name,
        company_name: data.company_name,
        email: data.email,
        phone: data.phone,
        source: data.source || 'MANUAL',
        assigned_user: data.assigned_user,
        status: data.status || 'NEW',
        expected_value: data.expected_value ? Number(data.expected_value) : 0,
        notes: data.notes
      }
    });
  }

  async updateLead(companyId: string, id: string, data: any) {
    return this.prisma.lead.update({
      where: { id, company_id: companyId },
      data
    });
  }

  async convertLead(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id, company_id: companyId } });
      if (!lead) throw new NotFoundException('Lead not found');
      if (lead.status === 'CONVERTED') throw new BadRequestException('Lead already converted');

      // 1. Check for Duplicate Customer by Email or Phone
      let customerId: string | undefined;
      let existingCustomer: any = null;

      if (lead.email || lead.phone) {
        existingCustomer = await tx.customer.findFirst({
          where: {
            company_id: companyId,
            OR: [
              { email: lead.email || 'non-existent' },
              { phone: lead.phone || 'non-existent' }
            ]
          }
        });
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create Customer
        const newCust = await tx.customer.create({
          data: {
            company_id: companyId,
            code: `CUST-${Date.now()}`,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: '',
          }
        });
        customerId = newCust.id;
      }

      // 2. Create Opportunity
      const opp = await tx.opportunity.create({
        data: {
          company_id: companyId,
          title: `Opp: ${lead.name}`,
          customer_id: customerId,
          lead_id: lead.id,
          expected_value: lead.expected_value,
          probability: 20, // Default Qualification probability
          stage: 'QUALIFICATION',
          assigned_user: lead.assigned_user,
        }
      });

      // 3. Mark Lead as Converted
      const updatedLead = await tx.lead.update({
        where: { id },
        data: { status: 'CONVERTED' }
      });

      return { lead: updatedLead, opportunity: opp, existingCustomerFound: !!existingCustomer };
    });
  }

  // ============================
  // OPPORTUNITIES
  // ============================
  async getOpportunities(companyId: string) {
    return this.prisma.opportunity.findMany({
      where: { company_id: companyId },
      include: { customer: true, lead: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async getOpportunity(companyId: string, id: string) {
    return this.prisma.opportunity.findFirst({
      where: { id, company_id: companyId },
      include: { customer: true, activities: true, lead: true }
    });
  }

  async createOpportunity(companyId: string, data: any) {
    return this.prisma.opportunity.create({
      data: {
        company_id: companyId,
        title: data.title,
        customer_id: data.customer_id,
        lead_id: data.lead_id,
        expected_value: Number(data.expected_value || 0),
        probability: Number(data.probability || 0),
        expected_close_date: data.expected_close_date ? new Date(data.expected_close_date) : null,
        assigned_user: data.assigned_user,
        stage: data.stage || 'NEW',
        notes: data.notes
      }
    });
  }

  async updateOpportunity(companyId: string, id: string, data: any) {
    return this.prisma.opportunity.update({
      where: { id, company_id: companyId },
      data
    });
  }

  // ============================
  // ACTIVITIES
  // ============================
  async getActivities(companyId: string) {
    return this.prisma.crmActivity.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: { lead: true, opportunity: true, customer: true }
    });
  }

  async createActivity(companyId: string, data: any) {
    return this.prisma.crmActivity.create({
      data: {
        company_id: companyId,
        type: data.type,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        due_date: data.due_date ? new Date(data.due_date) : null,
        assigned_user: data.assigned_user,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        customer_id: data.customer_id
      }
    });
  }

  async updateActivity(companyId: string, id: string, data: any) {
    return this.prisma.crmActivity.update({
      where: { id, company_id: companyId },
      data
    });
  }

  // ============================
  // CUSTOMER 360
  // ============================
  async getCustomer360(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, company_id: companyId }
    });

    if (!customer) throw new NotFoundException('Customer not found');

    const salesOrders = await this.prisma.salesOrder.findMany({
      where: { customer_id: customerId, company_id: companyId },
      orderBy: { created_at: 'desc' }
    });

    const quotations = await this.prisma.quotation.findMany({
      where: { customer_id: customerId, company_id: companyId },
      orderBy: { created_at: 'desc' }
    });

    const invoices = await this.prisma.invoice.findMany({
      where: { customer_id: customerId, company_id: companyId },
      orderBy: { created_at: 'desc' }
    });

    const opportunities = await this.prisma.opportunity.findMany({
      where: { customer_id: customerId, company_id: companyId },
      orderBy: { created_at: 'desc' }
    });

    const activities = await this.prisma.crmActivity.findMany({
      where: { customer_id: customerId, company_id: companyId },
      orderBy: { created_at: 'desc' }
    });

    let totalSales = 0;
    salesOrders.forEach(so => totalSales += so.total_amount);

    let outstandingInvoices = 0;
    invoices.forEach(inv => outstandingInvoices += inv.remaining_amount);

    return {
      profile: customer,
      sales: {
        totalSales,
        orderCount: salesOrders.length,
        orders: salesOrders,
        quotations
      },
      finance: {
        outstandingAmount: outstandingInvoices,
        invoiceCount: invoices.length,
        invoices
      },
      crm: {
        opportunities,
        activities
      }
    };
  }
}
