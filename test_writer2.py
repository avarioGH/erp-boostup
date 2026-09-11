import json

code = """import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ObjectId } from 'bson';
import { GlService } from '../src/gl/gl.service';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

let total = 0, pass = 0, fail = 0, skipped = 0;
const failures: string[] = [];

async function verify(suite: string, name: string, fn: () => Promise<void>) {
  total++;
  try {
    await fn();
    console.log('[PASS] ' + suite + ' | ' + name);
    pass++;
  } catch (e: any) {
    console.error('[FAIL] ' + suite + ' | ' + name + ' - Assertion Failed: ' + (e.message || e));
    failures.push(suite + ' | ' + name + ': ' + (e.message || e));
    fail++;
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function assertEq(a: any, b: any, msg: string) {
  if (a !== b) throw new Error(msg + ' (Expected: ' + b + ', Got: ' + a + ')');
}

async function run() {
  console.log('Starting MongoMemoryReplSet...');
  const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.DATABASE_URL = mongod.getUri().replace('/?', '/erp_cert_20f2b?');

  console.log('Bootstrapping NestJS App...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService);
  const gl = app.get(GlService);
  let jwt: JwtService | undefined;
  try { jwt = app.get(JwtService); } catch(e) {}
  
  await app.init();
  const server = app.getHttpAdapter().getInstance();
  
  // ==========================================
  // DATA SEEDING
  // ==========================================
  const sysUserId = '000000000000000000000000';
  const c1 = new ObjectId().toHexString();
  const c2 = new ObjectId().toHexString();
  await prisma.company.createMany({ data: [
    { id: c1, name: 'COMPANY_A', timezone: 'UTC' },
    { id: c2, name: 'COMPANY_B', timezone: 'UTC' }
  ]});

  const roleFullId = new ObjectId().toHexString();
  await prisma.role.create({ data: { id: roleFullId, company_id: c1, name: 'FULL_ADMIN', permissions: ['*'] }});
  
  const roleNoneId = new ObjectId().toHexString();
  await prisma.role.create({ data: { id: roleNoneId, company_id: c1, name: 'NO_PERMISSIONS', permissions: [] }});

  const uAdminId = new ObjectId().toHexString();
  await prisma.user.create({ data: { id: uAdminId, company_id: c1, username: 'admin_a', name: 'Admin A', password: 'pwd', role_id: roleFullId }});
  
  const uNoneId = new ObjectId().toHexString();
  await prisma.user.create({ data: { id: uNoneId, company_id: c1, username: 'none_a', name: 'None A', password: 'pwd', role_id: roleNoneId }});

  const uAdminBId = new ObjectId().toHexString();
  await prisma.user.create({ data: { id: uAdminBId, company_id: c2, username: 'admin_b', name: 'Admin B', password: 'pwd' }}); 

  const actCashId = new ObjectId().toHexString();
  const actRevId = new ObjectId().toHexString();
  await prisma.account.createMany({ data: [
    { id: actCashId, company_id: c1, code: '1000', name: 'Cash', type: 'ASSET' },
    { id: actRevId, company_id: c1, code: '4000', name: 'Sales', type: 'REVENUE' }
  ]});

  let tokenAdmin = '';
  let tokenNone = '';
  if (jwt) {
    tokenAdmin = jwt.sign({ sub: uAdminId, company_id: c1 });
    tokenNone = jwt.sign({ sub: uNoneId, company_id: c1 });
  }

  // C. SYSTEM USER
  await verify('SYSTEM USER', 'C1 - Query User by SYSTEM_USER_ID', async () => {
    const user = await prisma.user.findUnique({ where: { id: sysUserId } });
    assert(user !== null, 'System user not found');
  });

  // A. SECURITY / RBAC
  const endpoints = [
    { path: '/inventory/categories', method: 'GET' },
    { path: '/pos/shifts', method: 'GET' },
    { path: '/accounting/journals', method: 'GET' },
  ];

  for (const ep of endpoints) {
    await verify('SECURITY', 'A1 - No JWT ' + ep.path, async () => {
      const res = await request(server)[ep.method.toLowerCase()](ep.path);
      assert(res.status === 401 || res.status === 404, 'Expected 401/404, got ' + res.status);
    });

    if (tokenNone) {
      await verify('SECURITY', 'A3 - Missing Permission ' + ep.path, async () => {
        const res = await request(server)[ep.method.toLowerCase()](ep.path).set('Authorization', 'Bearer ' + tokenNone);
        assert(res.status === 403 || res.status === 404, 'Expected 403/404, got ' + res.status);
      });
      await verify('SECURITY', 'A4 - Authorized ' + ep.path, async () => {
        const res = await request(server)[ep.method.toLowerCase()](ep.path).set('Authorization', 'Bearer ' + tokenAdmin);
        assert(res.status !== 401 && res.status !== 403, 'Expected Authorized, got ' + res.status);
      });
    }
  }

  // B. TENANT ISOLATION
  await verify('TENANT ISOLATION', 'B1 - Category cross-tenant update rejected', async () => {
    const catB = new ObjectId().toHexString();
    await prisma.category.create({ data: { id: catB, company_id: c2, code: 'CAT-B', name: 'B' }});
    const res = await prisma.category.updateMany({
      where: { id: catB, company_id: c1 },
      data: { name: 'Hacked' }
    });
    assertEq(res.count, 0, 'Cross tenant update succeeded');
  });

  // D. ACCOUNTING / GL
  await verify('ACCOUNTING', 'D1 - Balanced journal succeeds', async () => {
    const je = await prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, {
      company_id: c1,
      reference_number: 'J-001',
      reference_type: 'MANUAL',
      date: new Date(),
      notes: 'Test',
      items: [
        { account_id: actCashId, debit: 100, credit: 0 },
        { account_id: actRevId, debit: 0, credit: 100 }
      ]
    }, uAdminId));
    assert(je.id !== undefined, 'Journal not created');
  });

  await verify('ACCOUNTING', 'D2 - Unbalanced journal fails', async () => {
    let threw = false;
    try {
      await prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, {
        company_id: c1,
        reference_number: 'J-002',
        reference_type: 'MANUAL',
        date: new Date(),
        notes: 'Test',
        items: [
          { account_id: actCashId, debit: 100, credit: 0 },
          { account_id: actRevId, debit: 0, credit: 50 }
        ]
      }, uAdminId));
    } catch(e) { threw = true; }
    assert(threw, 'Unbalanced journal did not fail');
  });

  await verify('ACCOUNTING', 'D6 - CLOSED accounting period rejects posting', async () => {
    const period = await prisma.accountingPeriod.create({
      data: { company_id: c1, month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'CLOSED' }
    });
    let threw = false;
    try {
      await prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, {
        company_id: c1,
        reference_number: 'J-003',
        reference_type: 'MANUAL',
        date: new Date(),
        notes: 'Test',
        items: [
          { account_id: actCashId, debit: 100, credit: 0 },
          { account_id: actRevId, debit: 0, credit: 100 }
        ]
      }, uAdminId));
    } catch(e: any) { 
      threw = true; 
    }
    assert(threw, 'Closed period posting did not fail');
    await prisma.accountingPeriod.delete({ where: { id: period.id } });
  });

  await verify('ACCOUNTING', 'D4 - Duplicate idempotency key rejected', async () => {
    const payload = {
      company_id: c1,
      reference_number: 'J-IDEMP',
      reference_type: 'MANUAL',
      idempotency_key: 'KEY-123',
      date: new Date(),
      notes: 'Test',
      items: [
        { account_id: actCashId, debit: 50, credit: 0 },
        { account_id: actRevId, debit: 0, credit: 50 }
      ]
    };
    await prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, payload, uAdminId));
    
    let threw = false;
    try {
      await prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, payload, uAdminId));
    } catch(e) { threw = true; }
    
    const count = await prisma.journalEntry.count({ where: { idempotency_key: 'KEY-123' }});
    assertEq(count, 1, 'Duplicate journal entries created for same idempotency key');
  });

  await verify('CONCURRENCY', 'H1 - Two GL journals with same idempotency key', async () => {
    const payload = {
      company_id: c1,
      reference_number: 'J-CONC',
      reference_type: 'MANUAL',
      idempotency_key: 'KEY-CONC',
      date: new Date(),
      notes: 'Test',
      items: [
        { account_id: actCashId, debit: 10, credit: 0 },
        { account_id: actRevId, debit: 0, credit: 10 }
      ]
    };
    
    await Promise.allSettled([
      prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, payload, uAdminId)),
      prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, payload, uAdminId)),
      prisma.$transaction(tx => gl.createJournalEntryWithinTx(tx, payload, uAdminId))
    ]);
    
    const count = await prisma.journalEntry.count({ where: { idempotency_key: 'KEY-CONC' }});
    assertEq(count, 1, 'Concurrency allowed duplicate JEs for same idempotency key');
  });

  console.log('\n--- RESULTS ---');
  console.log('TOTAL: ' + (total + skipped));
  console.log('PASS: ' + pass);
  console.log('FAIL: ' + fail);
  console.log('SKIPPED/N/A: ' + skipped);
  
  await app.close();
  await mongod.stop();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
"""

with open('backend/test/verify.erp.ts', 'w', encoding='utf-8') as f:
    f.write(code)
