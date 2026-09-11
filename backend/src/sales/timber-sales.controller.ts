import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from "@nestjs/common";
import { TimberSalesService } from "./timber-sales.service";

@Controller("sales/timber")
export class TimberSalesController {
  constructor(private readonly service: TimberSalesService) {}

  @Post("orders")
  createOrder(@Body() dto: any) { return this.service.createOrder(dto); }

  @Get("orders")
  findAllOrders(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
  ) { return this.service.findAllOrders(page, limit, status, customerId); }

  @Get("orders/:id")
  findOneOrder(@Param("id") id: string) { return this.service.findOneOrder(id); }

  @Post("orders/:id/confirm")
  confirmOrder(@Param("id") id: string) { return this.service.confirmOrder(id); }

  @Post("orders/:id/cancel")
  cancelOrder(@Param("id") id: string) { return this.service.cancelOrder(id); }

  @Post("orders/:id/deliveries")
  createDelivery(@Param("id") id: string, @Body() dto: any) { return this.service.createDelivery(id, dto); }

  @Get("orders/:id/realization")
  getRealization(@Param("id") id: string) { return this.service.getOrderRealization(id); }

  @Post("delivery/:id/post")
  postDelivery(@Param("id") id: string) { return this.service.postDelivery(id); }

  @Post("delivery/:id/cancel")
  cancelDelivery(@Param("id") id: string) { return this.service.cancelDelivery(id); }
}
