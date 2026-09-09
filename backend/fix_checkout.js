const fs = require('fs');

const code = \import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EcommerceCartService } from './ecommerce-cart.service';
import { TripayService } from '../integrations/providers/payment/tripay/tripay.service';

@Injectable()
export class EcommerceCheckoutService {
  private readonly logger = new Logger(EcommerceCheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private cartService: EcommerceCartService,
    private tripayService: TripayService
  ) {}

  async checkout(companyId: string, sessionId: string, payload: any) {
    const { email, name, phone, billing_address, delivery_address, fail_at } = payload;

    // 1. Idempotency Check (Outer check for immediate return if already processed)
    const existingIntent = await this.prisma.checkoutIdempotency.findFirst({
      where: { company_id: companyId, ecommerce_session_id: sessionId }
    });

    if (existingIntent) {
      return this.handleTripay(companyId, existingIntent.sales_order_id, payload.payment_method);
    }

    // 2. Fetch authoritative cart and calculate totals
    const cart = await this.cartService.getCart(companyId, sessionId);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');

    let salesOrderId: string;

    // 3. Perform database transaction
    try {
      const result = await this.prisma.\\(async (tx) => {
        // Resolve Customer
        let customer = await tx.customer.findFirst({
          where: { company_id: companyId, email }
        });
        
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              company_id: companyId,
              code: \\\EC-\\\\\\,
              name,
              email,
              phone,
              billing_address,
              delivery_address
            }
          });
        }

        if (fail_at === 'CUSTOMER') throw new Error('Test Failure: CUSTOMER');

        // Reserve Inventory (OCC)
        for (const item of cart.items) {
          const stocks = await tx.warehouseStock.findMany({
            where: { company_id: companyId, product_id: item.product_id, available_stock: { gte: item.quantity } },
            orderBy: { available_stock: 'desc' }
          });

          if (stocks.length === 0) {
            throw new BadRequestException(\\\Insufficient stock for \\\\\\);
          }

          const targetStock = stocks[0];
          
          const updateRes = await tx.warehouseStock.updateMany({
            where: { 
              id: targetStock.id, 
              available_stock: { gte: item.quantity } 
            },
            data: {
              available_stock: { decrement: item.quantity },
              reserved_stock: { increment: item.quantity }
            }
          });

          if (updateRes.count === 0) {
            throw new BadRequestException(\\\Insufficient stock for \\\ due to concurrent checkout\\\);
          }
        }

        if (fail_at === 'RESERVATION') throw new Error('Test Failure: RESERVATION');

        // Create Sales Order
        const orderNumber = \\\SO-EC-\\\\\\;
        const salesOrder = await tx.salesOrder.create({
          data: {
            company_id: companyId,
            customer_id: customer.id,
            order_number: orderNumber,
            order_date: new Date(),
            status: 'PENDING',
            total_amount: cart.grand_total,
            channel: 'ECOMMERCE',
            ecommerce_session_id: sessionId,
            billing_address,
            delivery_address,
            items: {
              create: cart.items.map(item => ({
                product_id: item.product_id,
                qty: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal
              }))
            }
          }
        });

        if (fail_at === 'SALES_ORDER') throw new Error('Test Failure: SALES_ORDER');

        // Create Invoice
        const invoiceNumber = \\\INV-EC-\\\\\\;
        const invoice = await tx.invoice.create({
          data: {
            company_id: companyId,
            type: 'AR',
            customer_id: customer.id,
            sales_order_id: salesOrder.id,
            invoice_number: invoiceNumber,
            invoice_date: new Date(),
            due_date: new Date(Date.now() + 86400000),
            status: 'POSTED',
            subtotal: cart.subtotal,
            tax: cart.tax,
            total: cart.grand_total,
            remaining_amount: cart.grand_total,
          }
        });

        if (fail_at === 'INVOICE') throw new Error('Test Failure: INVOICE');

        // Create checkout idempotency marker to prevent duplicate intents
        await tx.checkoutIdempotency.create({
          data: {
            company_id: companyId,
            ecommerce_session_id: sessionId,
            sales_order_id: salesOrder.id
          }
        });
        
        return { salesOrderId: salesOrder.id };
      });
      
      salesOrderId = result.salesOrderId;
      
      // Only clear cart on the first success
      await this.cartService.clearCart(companyId, sessionId);
      
    } catch (e: any) {
      if (e.code === 'P2002') {
        const check = await this.prisma.checkoutIdempotency.findFirst({
           where: { company_id: companyId, ecommerce_session_id: sessionId }
        });
        if (check) {
           return this.handleTripay(companyId, check.sales_order_id, payload.payment_method);
        }
      }
      throw e;
    }

    // 4. Call Tripay strictly AFTER commit
    return this.handleTripay(companyId, salesOrderId, payload.payment_method);
  }
  
  private async handleTripay(companyId: string, salesOrderId: string, paymentMethod: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { sales_order_id: salesOrderId }
    });
    
    if (!invoice) throw new BadRequestException('Invoice missing for order');

    try {
      const payment = await this.tripayService.createPaymentRequest(
        companyId, 
        invoice.customer_id || 'sys', 
        invoice.id, 
        paymentMethod || 'BRIVA'
      );
      return { success: true, order_id: salesOrderId, checkout_url: payment.redirect_url };
    } catch (err: any) {
      this.logger.error('Failed to create tripay transaction', err);
      return { success: true, order_id: salesOrderId, message: 'Order created but payment failed to initialize' };
    }
  }
}
\;

fs.writeFileSync('src/ecommerce/ecommerce-checkout.service.ts', code);
