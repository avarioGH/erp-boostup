const fs = require('fs');
let code = fs.readFileSync('backend/src/hr/hr.service.ts', 'utf8');

// 1. Fix clockAttendance adding company_id
code = code.replace(
  /data:\s*\{\s*employee_id:\s*employee\.id,\s*date:\s*clockTime,\s*status:\s*'PRESENT',\s*check_in:\s*clockTime,?\s*\}/g,
  "data: { company_id: companyId, employee_id: employee.id, date: clockTime, status: 'PRESENT', check_in: clockTime }"
);

// 2. Fix createAttendance adding company_id
code = code.replace(
  /employee_id:\s*data\.employeeId,/g,
  "company_id: companyId, employee_id: data.employeeId,"
);

// 3. Fix postPayroll
code = code.replace(
  /\/\/ Create a double-entry journal entry[\s\S]*?status:\s*'PENDING'\s*\}\s*\}\);\s*/,
  "// FinanceTransaction is deferred to payPayroll. Only accounting liability via event here.\n"
);
code = code.replace(
  /const account = await tx\.cashAccount\.findFirst.*?;\s*if \(!account\) throw new BadRequestException.*?;\s*/,
  ""
);

// 4. Fix payPayroll
const payPayrollReplacement = 
      // Enforce zero or negative protection
      if (p.net_salary < 0) throw new BadRequestException('Net salary cannot be negative');

      const account = await tx.cashAccount.findFirst({ where: { company_id: companyId } });
      if (!account) throw new BadRequestException('No default cash account mapped for company');

      // Create actual Cash Out transaction
      const f = await tx.financeTransaction.create({
        data: {
          company_id: companyId,
          cash_account_id: account.id,
          transaction_no: 'PAY-' + Date.now(),
          transaction_type: 'Cash Out',
          transaction_date: new Date(),
          total_amount: p.net_salary,
          reference_type: 'PAYROLL_PAYMENT',
          reference_id: p.id,
          description: 'Payroll Payment for ' + p.period,
          created_by: 'SYSTEM',
          status: 'COMPLETED'
        }
      });
      
      // Decrement cash balance
      await tx.cashAccount.update({
        where: { id: account.id },
        data: { current_balance: { decrement: p.net_salary } }
      });

      const updated = await tx.payroll.update({ where: { id }, data: { status: 'PAID', paid_date: new Date() } });
      await this.eventEmitter.emitAsync('payroll.payment', new PayrollPaymentEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { amount: p.net_salary }, tx as any));
      return updated;
;

code = code.replace(
  /\/\/ Find pending transaction and clear it[\s\S]*?return updated;/m,
  payPayrollReplacement.trim() + '\n    '
);

fs.writeFileSync('backend/src/hr/hr.service.ts', code, 'utf8');
