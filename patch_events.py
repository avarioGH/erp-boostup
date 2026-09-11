with open("backend/src/purchasing/purchasing.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    "invoice = await tx.invoice.update({",
    "invoice = await tx.invoice.update({"
)
c = c.replace(
    "return invoice;\n    });",
    """
        await this.eventEmitter.emitAsync('invoice.posted', {
          companyId, sourceEntityId: invoice.id, eventId: 'EVT-' + Date.now(), occurredAt: new Date(),
          payload: { type: 'VENDOR_BILL', totalAmount: invoice.total }, tx: tx as any
        });
        return invoice;
    });
"""
)
c = c.replace(
    "return payment;\n    });",
    """
        await this.eventEmitter.emitAsync('payment.processed', {
          companyId, sourceEntityId: payment.id, eventId: 'EVT-' + Date.now(), occurredAt: new Date(),
          payload: { type: 'AP_PAYMENT', amount: payment.amount, method: payment.payment_method }, tx: tx as any
        });
        return payment;
    });
"""
)
with open("backend/src/purchasing/purchasing.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

