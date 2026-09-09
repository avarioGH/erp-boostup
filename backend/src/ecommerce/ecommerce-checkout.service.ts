import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
    const { email, name, phone, billing_address, delivery_address } = payload;
    
    // 1. Idempotency Check
    const existingOrder = await this.prisma.salesOrder.findFirst({
      where: { company_id: companyId, ecommerce_session_id: sessionId }
    });
    
    if (existingOrder) {
      // Idempotency retry - return the payment link for the existing invoice
      const invoice = await this.prisma.invoice.findFirst({
        where: { sales_order_id: existingOrder.id }
      });
      if (!invoice) throw new BadRequestException('Invoice missing for existing order');
      
      // Attempt to re-generate tripay payment
      const payment = await this.tripayService.createPaymentRequest(companyId, 'sys', invoice.id, 'BRIVA');
      return { success: true, order_id: existingOrder.id, checkout_url: payment.redirect_url };
    }

    // 2. Fetch authoritative cart and calculate totals
    const cart = await this.cartService.getCart(companyId, sessionId);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');

    // 3. Resolve Customer
    let customer = await this.prisma.customer.findFirst({
      where: { company_id: companyId, email }
    });
    
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          company_id: companyId,
          code: `EC-${Date.now()}`,
          name,
          email,
          phone,
          billing_address,
          delivery_address
        }
      });
    }

    // 4. Reserve Inventory (OCC using updateMany)
    const reservations = [];
    for (const item of cart.items) {
      const stocks = await this.prisma.warehouseStock.findMany({
        where: { company_id: companyId, product_id: item.product_id, available_stock: { gte: item.quantity } },
        orderBy: { available_stock: 'desc' }
      });

      if (stocks.length === 0) {
        throw new BadRequestException(`Insufficient stock for ${item.product_name}`);
      }

      const targetStock = stocks[0];
      
      const updateRes = await this.prisma.warehouseStock.updateMany({
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
         throw new BadRequestException(`Insufficient stock for ${item.product_name} due to concurrent checkout`);
      }
      
      reservations.push({
        stock_id: targetStock.id,
        qty: item.quantity
      });
    }

    // 5. Create Sales Order
    const orderNumber = `SO-EC-${Date.now()}`;
    
    let salesOrder;
    try {
      salesOrder = await this.prisma.salesOrder.create({
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
    } catch(e: any) {
      if (e.code === 'P2002') {
         for (const res of reservations) {
            await this.prisma.warehouseStock.update({
               where: { id: res.stock_id },
               data: {
                 available_stock: { increment: res.qty },
                 reserved_stock: { decrement: res.qty }
               }
            });
         }
         await new Promise(r => setTimeout(r, 500));
         return this.checkout(companyId, sessionId, payload);
      }
      throw e;
    }

    // 6. Create Invoice
    const invoiceNumber = `INV-EC-${Date.now()}`;
    const invoice = await this.prisma.invoice.create({
      data: {
        company_id: companyId,
        type: 'AR',
        customer_id: customer.id,
        sales_order_id: salesOrder.id,
        invoice_number: invoiceNumber,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 86400000), // 1 day
        status: 'POSTED',
        subtotal: cart.subtotal,
        tax: cart.tax,
        total: cart.grand_total,
        remaining_amount: cart.grand_total,
      }
    });

    // 7. Clear the cart
    await this.cartService.clearCart(companyId, sessionId);

    // 8. Call Tripay
    try {
      const payment = await this.tripayService.createPaymentRequest(companyId, customer.id, invoice.id, payload.payment_method || 'BRIVA');
      return { success: true, order_id: salesOrder.id, checkout_url: payment.redirect_url };
    } catch (err: any) {
      this.logger.error('Failed to create tripay transaction', err);
      return { success: true, order_id: salesOrder.id, message: 'Order created but payment failed to initialize' };
    }
  }
}
