  async getFifoDiagnostic(companyId: string) {
    const stock = await this.prisma.warehouseStock.findMany({
      where: { company_id: companyId, current_stock: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, code: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const fifoLayers = await this.prisma.inventoryCostLayer.findMany({
      where: { company_id: companyId, remaining_quantity: { gt: 0 } },
      select: { warehouse_id: true, product_id: true, remaining_quantity: true, unit_cost: true },
    });

    const layerMap = new Map();
    fifoLayers.forEach(l => {
      const key = `${l.warehouse_id}_${l.product_id}`;
      if (!layerMap.has(key)) layerMap.set(key, { qty: 0, val: 0 });
      const current = layerMap.get(key);
      current.qty += l.remaining_quantity;
      current.val += (l.remaining_quantity * l.unit_cost);
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
        code: s.product.code,
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
