import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';

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

  // Define tools for Gemini
  private getTools() {
    return [
      {
        get_financial_summary: {
          name: 'get_financial_summary',
          description: 'Get the summary of cash and bank account balances for the company.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {},
          }
        },
      },
      {
        get_inventory_status: {
          name: 'get_inventory_status',
          description: 'Get a list of products and their current stock levels.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              limit: { type: SchemaType.INTEGER, description: 'Number of items to return (default 10)' }
            }
          }
        }
      },
      {
        update_product_price: {
          name: 'update_product_price',
          description: 'Update the selling price of a product by its exact name.',
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
    if (!this.genAI) {
      return { response: 'GEMINI_API_KEY is not configured on the server.' };
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{ functionDeclarations: Object.values(this.getTools()).map(t => Object.values(t)[0] as any) }],
        systemInstruction: `You are Avario AI, an advanced ERP assistant. You can read and modify internal data using the provided tools. 
        Always answer in Indonesian in a polite, professional, and helpful tone. Format currency nicely (e.g., Rp 10.000).
        If the user asks to do something you have a tool for, use the tool. If they ask something outside your tools, answer based on general knowledge but clarify it's not from the ERP database.`
      });

      const chat = model.startChat({
        history: chatHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
      });

      let result = await chat.sendMessage(prompt);
      const call = result.response.functionCalls()?.[0];

      if (call) {
        this.logger.log(`AI called function: ${call.name} with args: ${JSON.stringify(call.args)}`);
        
        const args: any = call.args;
        let apiResponse: any;
        if (call.name === 'get_financial_summary') {
          apiResponse = await this.getFinancialSummary(user.company_id);
        } else if (call.name === 'get_inventory_status') {
          apiResponse = await this.getInventoryStatus(user.company_id, args.limit as number);
        } else if (call.name === 'update_product_price') {
          apiResponse = await this.updateProductPrice(user.company_id, args.product_name as string, args.new_price as number);
        } else {
          apiResponse = { error: 'Function not found' };
        }

        // Send the function response back to Gemini
        result = await chat.sendMessage([{
          functionResponse: {
            name: call.name,
            response: apiResponse
          }
        }]);
      }

      const finalResponse = result.response.text();

      // Save to history
      await this.prisma.aiChatHistory.create({
        data: {
          company_id: user.company_id,
          user_id: user.id,
          prompt: prompt,
          response: finalResponse,
          module: 'General'
        }
      });

      return { response: finalResponse };

    } catch (error: any) {
      this.logger.error(`AI Chat Error: ${error.message}`);
      return { response: 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.' };
    }
  }

  async getHistory(companyId: string, userId: string) {
    return this.prisma.aiChatHistory.findMany({
      where: { company_id: companyId, user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }

  // --- Tool Implementations ---

  private async getFinancialSummary(companyId: string) {
    const accounts = await this.prisma.cashAccount.findMany({
      where: { company_id: companyId }
    });
    return {
      accounts: accounts.map(a => ({
        name: a.name,
        type: a.account_type,
        balance: a.current_balance
      })),
      total_balance: accounts.reduce((sum, a) => sum + a.current_balance, 0)
    };
  }

  private async getInventoryStatus(companyId: string, limit: number = 10) {
    const products = await this.prisma.product.findMany({
      where: { company_id: companyId },
      include: { warehouse_stocks: true },
      take: limit
    });
    return {
      products: products.map(p => ({
        name: p.name,
        code: p.code,
        price: p.selling_price,
        total_stock: p.warehouse_stocks.reduce((sum, s) => sum + s.current_stock, 0)
      }))
    };
  }

  private async updateProductPrice(companyId: string, productName: string, newPrice: number) {
    const product = await this.prisma.product.findFirst({
      where: { company_id: companyId, name: { contains: productName, mode: 'insensitive' } }
    });

    if (!product) {
      return { success: false, message: `Product containing name '${productName}' not found.` };
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { selling_price: newPrice }
    });

    return { 
      success: true, 
      message: `Successfully updated selling price of '${product.name}' to ${newPrice}.` 
    };
  }
}
