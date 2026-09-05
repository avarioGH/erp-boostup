const fs = require('fs');
const file = 'backend/src/hr/hr.service.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('PayrollPostedEvent')) {
  code = "import { EventEmitter2 } from '@nestjs/event-emitter';\nimport { PayrollPostedEvent, PayrollPaymentEvent } from '../events/accounting.events';\n" + code;
  code = code.replace("constructor(private prisma: PrismaService) {}", "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}");
}

code = code.replace(
  "return tx.payroll.update({ where: { id }, data: { status: 'POSTED' } });",
  "const updated = await tx.payroll.update({ where: { id }, data: { status: 'POSTED' } });\n      await this.eventEmitter.emitAsync('payroll.posted', new PayrollPostedEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { netSalary: p.net_salary, period: p.period }, tx as any));\n      return updated;"
);

code = code.replace(
  "return tx.payroll.update({ where: { id }, data: { status: 'PAID', paid_date: new Date() } });",
  "const updated = await tx.payroll.update({ where: { id }, data: { status: 'PAID', paid_date: new Date() } });\n      await this.eventEmitter.emitAsync('payroll.payment', new PayrollPaymentEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { amount: p.net_salary }, tx as any));\n      return updated;"
);

fs.writeFileSync(file, code);
