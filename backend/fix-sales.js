const fs = require('fs');
let file = 'src/sales/timber-sales.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/async findAllOrders\(page: number = 1, limit: number = 20, status\?: string, customerId\?: string\)/, "async findAllOrders(page: number = 1, limit: number = 20, status?: string, customerId?: string, companyId?: string)");
content = content.replace(/where: \{/, "where: { customer: { company_id: companyId },");
content = content.replace(/async findOneOrder\(id: string\) \{/, "async findOneOrder(id: string, companyId?: string) {");
content = content.replace(/where: \{ id \},/, "where: { id, customer: { company_id: companyId } },");

content = content.replace(/async confirmOrder\(id: string\)/, "async confirmOrder(id: string, companyId?: string)");
content = content.replace(/async cancelOrder\(id: string\)/, "async cancelOrder(id: string, companyId?: string)");
content = content.replace(/async getOrderRealization\(salesOrderId: string\)/, "async getOrderRealization(salesOrderId: string, companyId?: string)");
content = content.replace(/async postDelivery\(deliveryId: string\)/, "async postDelivery(deliveryId: string, companyId?: string)");
content = content.replace(/async cancelDelivery\(deliveryId: string\)/, "async cancelDelivery(deliveryId: string, companyId?: string)");

fs.writeFileSync(file, content);
