  @Permissions('inventory.view')
  @Get('fifo/diagnostic')
  async getFifoDiagnostic(@Request() req) {
    return this.inventoryService.getFifoDiagnostic(req.user.companyId);
  }
