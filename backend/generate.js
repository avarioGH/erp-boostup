const fs = require('fs');
const path = require('path');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim(), 'utf8');
}

write('src/integrations/integration.types.ts', \
export enum IntegrationType {
  PAYMENT = 'PAYMENT',
  COMMERCE = 'COMMERCE',
  BANK = 'BANK',
  SHIPPING = 'SHIPPING',
  COMMUNICATION = 'COMMUNICATION',
  OTHER = 'OTHER',
}
export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}
export enum WebhookStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  IGNORED = 'IGNORED',
}
export interface WebhookPayload {
  headers: Record<string, string>;
  body: any;
}
\);

write('src/integrations/integration-credential.service.ts', \
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationCredentialService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET || 'default-insecure-secret-key-32b';
    this.secretKey = crypto.scryptSync(secret, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return \\\\\\:\\\:\\\\\\;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encrypted) throw new Error('Invalid encrypted format');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async storeCredential(integrationId: string, key: string, value: string) {
    const encrypted = this.encrypt(value);
    await this.prisma.integrationCredential.upsert({
      where: { integration_id_key: { integration_id: integrationId, key } },
      update: { encrypted_value: encrypted },
      create: { integration_id: integrationId, key, encrypted_value: encrypted },
    });
  }

  async getCredential(integrationId: string, key: string): Promise<string | null> {
    const cred = await this.prisma.integrationCredential.findUnique({
      where: { integration_id_key: { integration_id: integrationId, key } },
    });
    if (!cred) return null;
    return this.decrypt(cred.encrypted_value);
  }
}
\);

write('src/integrations/integration-idempotency.service.ts', \
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationIdempotencyService {
  constructor(private prisma: PrismaService) {}

  async checkAndLock(companyId: string, integrationId: string, key: string, operation: string) {
    try {
      const lock = await this.prisma.integrationIdempotency.create({
        data: {
          company_id: companyId,
          integration_id: integrationId,
          idempotency_key: key,
          operation,
          status: 'PROCESSING'
        }
      });
      return lock;
    } catch (error) {
      if (error.code === 'P2002') {
        const existing = await this.prisma.integrationIdempotency.findUnique({
          where: { company_id_integration_id_idempotency_key: { company_id: companyId, integration_id: integrationId, idempotency_key: key } }
        });
        throw new ConflictException({ message: 'Idempotency conflict', state: existing });
      }
      throw error;
    }
  }

  async complete(id: string, response: any) {
    await this.prisma.integrationIdempotency.update({
      where: { id },
      data: { status: 'COMPLETED', response }
    });
  }

  async fail(id: string, response: any) {
    await this.prisma.integrationIdempotency.update({
      where: { id },
      data: { status: 'FAILED', response }
    });
  }
}
\);

write('src/integrations/integration-log.service.ts', \
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationLogService {
  constructor(private prisma: PrismaService) {}

  async logEvent(companyId: string, userId: string, action: string, integrationId: string, details: any) {
    const safeDetails = { ...details };
    if (safeDetails.secret) safeDetails.secret = '***';
    if (safeDetails.apiKey) safeDetails.apiKey = '***';
    
    await this.prisma.auditLog.create({
      data: {
        company_id: companyId,
        user_id: userId,
        action,
        module: 'INTEGRATION',
        entity_type: 'INTEGRATION',
        entity_id: integrationId,
        details: safeDetails,
        ip_address: '0.0.0.0',
        user_agent: 'SYSTEM'
      }
    });
  }
}
\);

write('src/integrations/integration-webhook.service.ts', \
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookStatus } from './integration.types';

@Injectable()
export class IntegrationWebhookService {
  private readonly logger = new Logger(IntegrationWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async recordIncoming(companyId: string, integrationId: string, eventId: string, type: string, payload: any) {
    return this.prisma.webhookEvent.create({
      data: {
        company_id: companyId,
        integration_id: integrationId,
        external_event_id: eventId,
        event_type: type,
        payload,
        status: WebhookStatus.RECEIVED,
      }
    });
  }

  async markProcessed(id: string) {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { status: WebhookStatus.PROCESSED, processed_at: new Date() }
    });
  }

  async markFailed(id: string, errorMessage: string, attempts: number) {
    const maxRetries = 3;
    const nextRetry = attempts < maxRetries ? new Date(Date.now() + 1000 * 60 * Math.pow(2, attempts)) : null;
    
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { 
        status: WebhookStatus.FAILED, 
        error_message: errorMessage,
        attempts: { increment: 1 },
        next_retry_at: nextRetry
      }
    });
  }
}
\);

write('src/integrations/integrations.service.ts', \
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationLogService } from './integration-log.service';
import { IntegrationCredentialService } from './integration-credential.service';
import { IntegrationType } from './integration.types';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private logger: IntegrationLogService,
    private credentials: IntegrationCredentialService
  ) {}

  async findAll(companyId: string) {
    return this.prisma.integration.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, type: true, provider: true, environment: true, status: true, is_active: true, created_at: true }
    });
  }

  async findOne(companyId: string, id: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, company_id: companyId }
    });
    if (!integration) throw new NotFoundException('Integration not found');
    return integration;
  }

  async create(companyId: string, userId: string, data: any) {
    const integration = await this.prisma.integration.create({
      data: {
        company_id: companyId,
        name: data.name,
        type: data.type,
        provider: data.provider,
        environment: data.environment || 'TEST',
        configuration: data.configuration || {}
      }
    });

    if (data.credentials) {
      for (const [key, value] of Object.entries(data.credentials)) {
        await this.credentials.storeCredential(integration.id, key, value as string);
      }
    }

    await this.logger.logEvent(companyId, userId, 'INTEGRATION_CREATED', integration.id, { provider: data.provider });
    return integration;
  }

  async update(companyId: string, userId: string, id: string, data: any) {
    await this.findOne(companyId, id);
    const integration = await this.prisma.integration.update({
      where: { id },
      data: {
        name: data.name,
        environment: data.environment,
        configuration: data.configuration,
      }
    });

    if (data.credentials) {
      for (const [key, value] of Object.entries(data.credentials)) {
        await this.credentials.storeCredential(id, key, value as string);
      }
    }
    
    await this.logger.logEvent(companyId, userId, 'INTEGRATION_UPDATED', id, { provider: integration.provider });
    return integration;
  }

  async toggleStatus(companyId: string, userId: string, id: string, isActive: boolean) {
    await this.findOne(companyId, id);
    const integration = await this.prisma.integration.update({
      where: { id },
      data: { 
        is_active: isActive, 
        status: isActive ? 'ACTIVE' : 'INACTIVE' 
      }
    });
    await this.logger.logEvent(companyId, userId, isActive ? 'INTEGRATION_ACTIVATED' : 'INTEGRATION_DEACTIVATED', id, { provider: integration.provider });
    return integration;
  }
}
\);

write('src/integrations/integrations.controller.ts', \
import { Controller, Get, Post, Body, Param, Put, Patch, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { IntegrationsService } from './integrations.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Permissions('integration.read')
  @Get()
  async findAll(@Request() req: any) {
    return this.integrationsService.findAll(req.user.company_id);
  }

  @Permissions('integration.read')
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.integrationsService.findOne(req.user.company_id, id);
  }

  @Permissions('integration.create')
  @Post()
  async create(@Request() req: any, @Body() data: any) {
    return this.integrationsService.create(req.user.company_id, req.user.id, data);
  }

  @Permissions('integration.update')
  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.integrationsService.update(req.user.company_id, req.user.id, id, data);
  }

  @Permissions('integration.update')
  @Post(':id/activate')
  async activate(@Request() req: any, @Param('id') id: string) {
    return this.integrationsService.toggleStatus(req.user.company_id, req.user.id, id, true);
  }

  @Permissions('integration.update')
  @Post(':id/deactivate')
  async deactivate(@Request() req: any, @Param('id') id: string) {
    return this.integrationsService.toggleStatus(req.user.company_id, req.user.id, id, false);
  }
}
\);

write('src/integrations/integrations.module.ts', \
import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationCredentialService } from './integration-credential.service';
import { IntegrationIdempotencyService } from './integration-idempotency.service';
import { IntegrationWebhookService } from './integration-webhook.service';
import { IntegrationLogService } from './integration-log.service';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    IntegrationCredentialService,
    IntegrationIdempotencyService,
    IntegrationWebhookService,
    IntegrationLogService
  ],
  exports: [
    IntegrationsService,
    IntegrationCredentialService,
    IntegrationIdempotencyService,
    IntegrationWebhookService
  ]
})
export class IntegrationsModule {}
\);
