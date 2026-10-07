  async getFifoDiagnostic(companyId: string) {
    const stock = await this.prisma.warehouseStock.findMany({
      where: { company_id: companyId, current_stock: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const fifoLayers = await this.prisma.inventoryCostLayer.groupBy({
      by: ['warehouse_id', 'product_id'],
      where: { company_id: companyId, remaining_quantity: { gt: 0 } },
      _sum: { remaining_quantity: true, total_cost: true },
    });

    const layerMap = new Map();
    fifoLayers.forEach(l => {
      layerMap.set(`${l.warehouse_id}_${l.product_id}`, {
        qty: Number(l._sum.remaining_quantity || 0),
        val: Number(l._sum.total_cost || 0),
      });
    });

    const result = stock.map(s => {
      const layer = layerMap.get(`${s.warehouse_id}_${s.product_id}`);
      const physicalQty = Number(s.current_stock);
      const fifoQty = layer ? layer.qty : 0;
      
      let status = 'OK';
      if (fifoQty < physicalQty && fifoQty > 0) status = 'INSUFFICIENT_COVERAGE';
      else if (fifoQty === 0 && physicalQty > 0) status = 'NO_COVERAGE';
      else if (fifoQty > physicalQty) status = 'EXCEEDS_PHYSICAL_STOCK';

      return {
        productId: s.product_id,
        sku: s.product.sku,
        productName: s.product.name,
        warehouseId: s.warehouse_id,
        warehouseName: s.warehouse.name,
        physicalQuantity: physicalQty,
        fifoQuantity: fifoQty,
        fifoValue: layer ? layer.val : 0,
        difference: physicalQty - fifoQty,
        status,
      };
    });

    return result;
  }
