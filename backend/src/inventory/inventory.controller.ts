import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('categories')
  async createCategory(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.inventoryService.createCategory(data);
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateCategory(id, data);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.inventoryService.deleteCategory(id);
  }

  @Get('products')
  async getProducts(@Request() req) {
    return this.inventoryService.getProducts(req.user.company_id);
  }

  @Post('products')
  @UseInterceptors(FilesInterceptor('images', 8, {
    storage: diskStorage({
      destination: (req, file, cb) => { const fs = require('fs'); const dir = './uploads/products'; if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); cb(null, dir); },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async createProduct(
    @Request() req, 
    @Body() data: any,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      // Add files array and company_id to data
      data.companyId = req.user.company_id || req.user.companyId;
      if (files && files.length > 0) {
        data.images = files.map(file => `/uploads/products/${file.filename}`);
      }
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

  @Post('transfer/:id/validate')
  async validateTransfer(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.validateTransfer(req.user.company_id, id, req.user.id);
  }

  @Post('adjustment/:id/validate')
  async validateAdjustment(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.validateAdjustment(req.user.company_id, id, req.user.id);
  }

  @Post('stock-opname')
  async createStockOpname(@Request() req: any, @Body() data: { warehouseId: string, productIds?: string[] }) {
    return this.inventoryService.createStockOpname(req.user.company_id, data.warehouseId, req.user.id, data.productIds);
  }

  @Post('stock-opname/:id/approve')
  async approveStockOpname(@Request() req: any, @Param('id') id: string, @Body() data: { counts: { productId: string, countedQty: number }[] }) {
    return this.inventoryService.approveStockOpname(req.user.company_id, id, req.user.id, data.counts);
  }

  @Get('movements')
  async getMovements(@Request() req: any) {
    return this.inventoryService['prisma'].stockMovement.findMany({
      where: { company_id: req.user.company_id },
      include: { product: true, warehouse: true },
      orderBy: { created_at: 'desc' }
    });
  }
}

