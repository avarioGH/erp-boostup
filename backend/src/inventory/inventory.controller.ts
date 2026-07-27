import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('categories')
  async getCategories(@Request() req) {
    return this.inventoryService.getCategories(req.user.company_id);
  }

  @Get('products')
  async getProducts(@Request() req) {
    return this.inventoryService.getProducts(req.user.company_id);
  }

  @Post('products')
  async createProduct(@Request() req, @Body() data: any) {
    try {
      data.companyId = req.user.company_id || req.user.companyId;
      return await this.inventoryService.createProduct(data);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  @Get('warehouses')
  async getWarehouses(@Request() req) {
    return this.inventoryService.getWarehouses(req.user.company_id);
  }

  @Post('warehouses')
  async createWarehouse(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.inventoryService.createWarehouse(data);
  }

  @Put('warehouses/:id')
  async updateWarehouse(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateWarehouse(id, data);
  }

  @Delete('warehouses/:id')
  async deleteWarehouse(@Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(id);
  }

  @Get('transactions')
  async getTransactions(@Request() req) {
    return this.inventoryService.getTransactions(req.user.company_id);
  }

  @Get('stocks')
  async getStocks(@Request() req) {
    return this.inventoryService.getWarehouseStocks(req.user.company_id);
  }

  @Post('inbound')
  async createInbound(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    data.userId = req.user.userId || req.user.id;
    // Generate simple transaction no if not provided
    if (!data.transactionNo) {
      data.transactionNo = `IN-${Date.now()}`;
    }
    data.transactionDate = new Date();
    return this.inventoryService.createInbound(data);
  }

  @Post('outbound')
  async createOutbound(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    data.userId = req.user.userId || req.user.id;
    if (!data.transactionNo) {
      data.transactionNo = `OUT-${Date.now()}`;
    }
    data.transactionDate = new Date();
    return this.inventoryService.createOutbound(data);
  }

  @Post('transfer')
  async createTransfer(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    data.userId = req.user.userId || req.user.id;
    if (!data.transactionNo) {
      data.transactionNo = `TRF-${Date.now()}`;
    }
    data.transactionDate = new Date();
    return this.inventoryService.createTransfer(data);
  }

  @Post('adjustment')
  async createAdjustment(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    data.userId = req.user.userId || req.user.id;
    if (!data.transactionNo) {
      data.transactionNo = `ADJ-${Date.now()}`;
    }
    data.transactionDate = new Date();
    return this.inventoryService.createAdjustment(data);
  }
}
