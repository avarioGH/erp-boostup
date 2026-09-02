import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private getTools() {
    return [
      {
        get_financial_summary: {
          name: 'get_financial_summary',
          description: 'Get the summary of cash and bank account balances for the company.',
          parameters: { type: SchemaType.OBJECT, properties: {} }
        },
      },
      {
        get_inventory_status: {
          name: 'get_inventory_status',
          description: 'Get a list of products and their current stock levels.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: { limit: { type: SchemaType.INTEGER, description: 'Number of items to return' } }
          }
        }
      },
      {
        update_product_price: {
          name: 'update_product_price',
          description: 'Propose an update to the selling price of a product by its exact name. THIS REQUIRES USER PERMISSION.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              product_name: { type: SchemaType.STRING, description: 'The exact name of the product' },
              new_price: { type: SchemaType.NUMBER, description: 'The new selling price' }
            },
            required: ['product_name', 'new_price']
          }
        }
      }
    ];
  }

  async handleChat(user: any, prompt: string, chatHistory: any[]) {
    if (!this.genAI) return { response: 'GEMINI_API_KEY is not configured.' };

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{ functionDeclarations: Object.values(this.getTools()).map(t => Object.values(t)[0] as any) }],
        systemInstruction: `You are Avario AI, an advanced ERP assistant. 
        If asked to change data, use the appropriate tool. The system will automatically ask the user for permission. Just tell the user you have prepared the action for their approval.`
      });

      const chat = model.startChat({
        history: chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      });

      let result = await chat.sendMessage(prompt);
      const call = result.response.functionCalls()?.[0];
      
      let pendingAction: any = null;

      if (call) {
        const args: any = call.args;
        let apiResponse: any;

        // READ operations
        if (call.name === 'get_financial_summary') {
          apiResponse = await this.getFinancialSummary(user.company_id);
          result = await chat.sendMessage([{ functionResponse: { name: call.name, response: apiResponse } }]);
        } 
        else if (call.name === 'get_inventory_status') {
          apiResponse = await this.getInventoryStatus(user.company_id, args.limit as number);
          result = await chat.sendMessage([{ functionResponse: { name: call.name, response: apiResponse } }]);
        } 
        // WRITE operations (Propose only)
        else if (call.name === 'update_product_price') {
          const proposal = await this.proposeUpdateProductPrice(user.company_id, args.product_name, args.new_price);
          
          if (proposal.success) {
            pendingAction = proposal.action;
            apiResponse = { status: 'PROPOSAL_CREATED_WAITING_FOR_USER_APPROVAL', message: 'Tolong beritahu user bahwa tombol persetujuan sudah muncul di layar.' };
          } else {
            apiResponse = { status: 'FAILED', message: proposal.message };
          }
          result = await chat.sendMessage([{ functionResponse: { name: call.name, response: apiResponse } }]);
        }
      }

      const finalResponse = result.response.text();

      await this.prisma.aiChatHistory.create({
        data: {
          company_id: user.company_id,
          user_id: user.id,
          prompt: prompt,
          response: finalResponse,
          module: 'General'
        }
      });

      return { response: finalResponse, action: pendingAction };

    } catch (error: any) {
      this.logger.error(`AI Chat Error: ${error.message}`);
      return { response: 'Maaf, terjadi kesalahan saat menghubungi AI.' };
    }
  }

  // --- Read Tools ---
  private async getFinancialSummary(companyId: string) {
    const accounts = await this.prisma.cashAccount.findMany({ where: { company_id: companyId } });
    return {
      accounts: accounts.map(a => ({ name: a.name, balance: a.current_balance })),
      total: accounts.reduce((sum, a) => sum + a.current_balance, 0)
    };
  }

  private async getInventoryStatus(companyId: string, limit: number = 10) {
    const products = await this.prisma.product.findMany({
      where: { company_id: companyId },
      include: { warehouse_stocks: true },
      take: limit || 10
    });
    return {
      products: products.map(p => ({
        name: p.name,
        price: p.selling_price,
        stock: p.warehouse_stocks.reduce((sum, s) => sum + s.current_stock, 0)
      }))
    };
  }

  // --- Write Tools (Propose & Execute) ---
  private async proposeUpdateProductPrice(companyId: string, productName: string, newPrice: number) {
    const product = await this.prisma.product.findFirst({
      where: { company_id: companyId, name: { contains: productName, mode: 'insensitive' } }
    });

    if (!product) return { success: false, message: `Produk '${productName}' tidak ditemukan.` };

    return { 
      success: true, 
      action: {
        type: 'UPDATE_PRODUCT_PRICE',
        title: `Ubah Harga: ${product.name}`,
        description: `Harga akan diubah dari Rp ${product.selling_price} menjadi Rp ${newPrice}`,
        payload: { productId: product.id, newPrice: newPrice },
        undoData: { productId: product.id, oldPrice: product.selling_price }
      }
    };
  }

  async executeAction(companyId: string, actionData: any) {
    if (actionData.type === 'UPDATE_PRODUCT_PRICE') {
      await this.prisma.product.update({
        where: { id: actionData.payload.productId, company_id: companyId },
        data: { selling_price: actionData.payload.newPrice }
      });
      return { success: true, message: 'Harga berhasil diperbarui.' };
    }
    return { success: false, message: 'Tindakan tidak dikenal.' };
  }

  async undoAction(companyId: string, actionData: any) {
    if (actionData.type === 'UPDATE_PRODUCT_PRICE') {
      await this.prisma.product.update({
        where: { id: actionData.undoData.productId, company_id: companyId },
        data: { selling_price: actionData.undoData.oldPrice }
      });
      return { success: true, message: 'Perubahan harga berhasil dibatalkan (Undo).' };
    }
    return { success: false, message: 'Tindakan tidak dikenal.' };
  }

  async getHistory(companyId: string, userId: string) {
    return this.prisma.aiChatHistory.findMany({
      where: { company_id: companyId, user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }
}
