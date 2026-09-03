import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: 'sk-p8GXAXmljYonz0t5fvS0r09aN9K6iPvkCpR9UWyhXuU9ykf8',
      baseURL: 'https://router.juan.web.id/v1'
    });
  }

  private getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'get_financial_summary',
          description: 'Get the summary of cash and bank account balances for the company.',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_inventory_status',
          description: 'Get a list of products and their current stock levels.',
          parameters: {
            type: 'object',
            properties: { limit: { type: 'integer', description: 'Number of items to return' } }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_product_price',
          description: 'Propose an update to the selling price of a product by its exact name. THIS REQUIRES USER PERMISSION.',
          parameters: {
            type: 'object',
            properties: {
              product_name: { type: 'string', description: 'The exact name of the product' },
              new_price: { type: 'number', description: 'The new selling price' }
            },
            required: ['product_name', 'new_price']
          }
        }
      }
    ];
  }

  async handleChat(user: any, prompt: string, chatHistory: any[]) {
    try {
      const messages: any[] = [
        {
          role: 'system',
          content: `You are Avario AI, an advanced ERP assistant. 
          If asked to change data, use the appropriate tool. The system will automatically ask the user for permission. Just tell the user you have prepared the action for their approval.`
        }
      ];

      for (const h of chatHistory) {
        messages.push({
          role: h.role === 'model' ? 'assistant' : h.role,
          content: h.text
        });
      }

      messages.push({ role: 'user', content: prompt });

      let result = await this.openai.chat.completions.create({
        model: 'gemini-1.5-flash',
        messages: messages,
        tools: this.getTools() as any,
        tool_choice: 'auto'
      });

      let responseMessage = result.choices[0].message;
      let pendingAction: any = null;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        messages.push(responseMessage);
        
        for (const rawToolCall of responseMessage.tool_calls) {
          const toolCall = rawToolCall as any;
          const args = JSON.parse(toolCall.function.arguments);
          let apiResponse: any;

          if (toolCall.function.name === 'get_financial_summary') {
            apiResponse = await this.getFinancialSummary(user.company_id);
          } else if (toolCall.function.name === 'get_inventory_status') {
            apiResponse = await this.getInventoryStatus(user.company_id, args.limit as number);
          } else if (toolCall.function.name === 'update_product_price') {
            const proposal = await this.proposeUpdateProductPrice(user.company_id, args.product_name, args.new_price);
            if (proposal.success) {
              pendingAction = proposal.action;
              apiResponse = { status: 'PROPOSAL_CREATED_WAITING_FOR_USER_APPROVAL', message: 'Tolong beritahu user bahwa tombol persetujuan sudah muncul di layar.' };
            } else {
              apiResponse = { status: 'FAILED', message: proposal.message };
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(apiResponse)
          });
        }

        result = await this.openai.chat.completions.create({
          model: 'gemini-1.5-flash',
          messages: messages,
        });

        responseMessage = result.choices[0].message;
      }

      const finalResponse = responseMessage.content || '';

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
      accounts: accounts.map(a => ({ name: a.name, balance: Number(a.current_balance) })),
      total: accounts.reduce((sum, a) => sum + Number(a.current_balance), 0)
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
