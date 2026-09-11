import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ObjectId } from 'bson';

async function bootstrap() {
  console.log('Starting MongoMemoryReplSet...');
  const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.DATABASE_URL = mongod.getUri().replace('/?', '/erp_e2e?');

  console.log('Bootstrapping NestJS App...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });

  const prisma = app.get(PrismaService);
  await app.init();
  
  const c1 = new ObjectId().toHexString();
  await prisma.company.create({ data: { id: c1, name: 'COMPANY_E2E', timezone: 'UTC' }});

  const roleFullId = new ObjectId().toHexString();
  await prisma.role.create({ data: { id: roleFullId, company_id: c1, name: 'FULL_ADMIN' }});

  const roleHrId = new ObjectId().toHexString();
  await prisma.role.create({ data: { id: roleHrId, company_id: c1, name: 'HR_ONLY' }});

  const p1 = new ObjectId().toHexString();
  await prisma.permission.create({ data: { id: p1, name: '*', description: 'All' }});
  await prisma.rolePermission.create({ data: { role_id: roleFullId, permission_id: p1 }});

  const pHr = new ObjectId().toHexString();
  await prisma.permission.create({ data: { id: pHr, name: 'hr.view', description: 'HR View' }});
  await prisma.rolePermission.create({ data: { role_id: roleHrId, permission_id: pHr }});

  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('password123', 10);

  await prisma.user.create({ data: { 
    id: new ObjectId().toHexString(), company_id: c1, username: 'admin', name: 'Admin', password: hash, role_id: roleFullId 
  }});

  await prisma.user.create({ data: { 
    id: new ObjectId().toHexString(), company_id: c1, username: 'hr_user', name: 'HR User', password: hash, role_id: roleHrId 
  }});

  await prisma.accountingPeriod.create({
    data: { id: new ObjectId().toHexString(), company_id: c1, month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'OPEN', start_date: new Date('2000-01-01'), end_date: new Date('2100-01-01') }
  });

  await app.listen(3000, '0.0.0.0');
  console.log('E2E Server listening on port 3000');
}
bootstrap().catch(console.error);
