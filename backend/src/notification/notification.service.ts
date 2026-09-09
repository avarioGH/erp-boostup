// @ts-nocheck
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  severity?: string; // INFO, SUCCESS, WARNING, ERROR
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  idempotencyKey?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async send(data: CreateNotificationDto) {
    try {
      if (data.idempotencyKey) {
        const existing = await this.prisma.notification.findUnique({
          where: { idempotency_key: data.idempotencyKey }
        });
        if (existing) {
          this.logger.debug('Skipping duplicate notification: ' + data.idempotencyKey);
          return existing;
        }
      }

      const notification = await this.prisma.notification.create({
        data: {
          company_id: data.companyId,
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          severity: data.severity || 'INFO',
          entity_type: data.entityType,
          entity_id: data.entityId,
          action_url: data.actionUrl,
          idempotency_key: data.idempotencyKey
        }
      });

      return notification;
    } catch (e) {
      this.logger.error('Failed to save notification', e);
      // Fail silently to prevent domain rollback
      return null;
    }
  }

  async getNotifications(companyId: string, userId: string, skip = 0, take = 50) {
    return this.prisma.notification.findMany({
      where: { company_id: companyId, user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take
    });
  }

  async getUnreadCount(companyId: string, userId: string) {
    return this.prisma.notification.count({
      where: { company_id: companyId, user_id: userId, is_read: false }
    });
  }

  async markAsRead(companyId: string, userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, company_id: companyId, user_id: userId }
    });
    if (!notif) throw new NotFoundException('Notification not found');

    if (notif.is_read) return notif;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true, read_at: new Date() }
    });
  }

  async markAllAsRead(companyId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { company_id: companyId, user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() }
    });
  }
}

