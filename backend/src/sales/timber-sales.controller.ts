import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Request } from "@nestjs/common";
import { TimberSalesService } from "./timber-sales.service";
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller("sales/timber")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimberSalesController {
  constructor(private readonly service: TimberSalesService) {}

  @Post("orders")
  @Permissions('write_inventory')
  createOrder(@Body() dto: any, @Request() req: any) { 
    return this.service.createOrder({ ...dto, companyId: req.user.companyId || req.user.company_id }); 
  }

  @Get("orders")
  @Permissions('read_inventory')
  findAllOrders(
    @Request() req: any,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
  ) { 
    return this.service.findAllOrders(page, limit, status, customerId, req.user.companyId || req.user.company_id); 
  }

  @Get("orders/:id")
  @Permissions('read_inventory')
  findOneOrder(@Param("id") id: string, @Request() req: any) { 
    return this.service.findOneOrder(id, req.user.companyId || req.user.company_id); 
  }

  @Post("orders/:id/confirm")
  @Permissions('write_inventory')
  confirmOrder(@Param("id") id: string, @Request() req: any) { 
    return this.service.confirmOrder(id, req.user.companyId || req.user.company_id); 
  }

  @Post("orders/:id/cancel")
  @Permissions('write_inventory')
  cancelOrder(@Param("id") id: string, @Request() req: any) { 
    return this.service.cancelOrder(id, req.user.companyId || req.user.company_id); 
  }

  @Post("orders/:id/deliveries")
  @Permissions('write_inventory')
  createDelivery(@Param("id") id: string, @Body() dto: any, @Request() req: any) { 
    return this.service.createDelivery(id, { ...dto, companyId: req.user.companyId || req.user.company_id }); 
  }

  @Get("orders/:id/realization")
  @Permissions('read_inventory')
  getRealization(@Param("id") id: string, @Request() req: any) { 
    return this.service.getOrderRealization(id, req.user.companyId || req.user.company_id); 
  }

  @Post("delivery/:id/post")
  @Permissions('write_inventory')
  postDelivery(@Param("id") id: string, @Request() req: any) { 
    return this.service.postDelivery(id, req.user.companyId || req.user.company_id); 
  }

  @Post("delivery/:id/cancel")
  @Permissions('write_inventory')
  cancelDelivery(@Param("id") id: string, @Request() req: any) { 
    return this.service.cancelDelivery(id, req.user.companyId || req.user.company_id); 
  }
}
